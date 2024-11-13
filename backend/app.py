from flask import Flask, request, jsonify
from flask_cors import CORS
from sklearn.metrics.pairwise import cosine_similarity
from transformers import AutoTokenizer, TFAutoModel, TFBertForSequenceClassification
import numpy as np
import pandas as pd
import tensorflow as tf
import json
import re

app = Flask(__name__)
CORS(app)

sentiment_cache = {}

with open('../frontend/src/assets/movies.json', 'r') as file:
    data = json.load(file)

document = pd.DataFrame(data)

model_name = 'bert-base-uncased'
custom_objects = {'TFBertForSequenceClassification': TFBertForSequenceClassification}
tokenizer = AutoTokenizer.from_pretrained(model_name)
model = TFAutoModel.from_pretrained(model_name)
sentiment_model = tf.keras.models.load_model('./bert_cnn_best_model.keras', custom_objects=custom_objects)

def encode_text(text):
    inputs = tokenizer(text, return_tensors='tf', truncation=True, padding=True)
    outputs = model(**inputs)
    return outputs.pooler_output.numpy()

synopsis_vectors = np.vstack(document['synopsis_vectorized'].apply(np.array).values)
cast_vectors = np.vstack(document['cast_vectorized'].apply(np.array).values)
director_vectors = np.vstack(document['director_vectorized'].apply(np.array).values)
producer_vectors = np.vstack(document['producer_vectorized'].apply(np.array).values)
writer_vectors = np.vstack(document['writer_vectorized'].apply(np.array).values)
title_vectors = np.vstack(document['title_vectorized'].apply(np.array).values)
genres_vectors = np.vstack(document['genres_vectorized'].apply(np.array).values)

def semantic_search(input_keywords, df, top_k=9, initial_top_k=15):
    results = []
    valid_query_types = {
        'Synopsis': synopsis_vectors,
        'Cast': cast_vectors,
        'Director': director_vectors,
        'Producers': producer_vectors,
        'Writers': writer_vectors,
        'Title': title_vectors,
        'Genres': genres_vectors
    }

    for query_type, query in input_keywords.items():
        if query_type not in valid_query_types:
            raise ValueError(f'Invalid query type: {query_type}. Valid types are: {list(valid_query_types.keys())}')

        if not query:  # Skip empty queries
            continue

        vectors = valid_query_types[query_type]

        # Encode the query text(s)
        if isinstance(query, list):
            query_vectors = [encode_text(keyword).reshape(1, -1) for keyword in query]
            query_vector = np.mean(query_vectors, axis=0)  # Averaging vectors for multiple keywords
        else:
            query_vector = encode_text(query).reshape(1, -1)

        # Calculate cosine similarity
        similarities = cosine_similarity(query_vector, vectors).flatten()

        # Initial top-k matches based on similarity scores
        initial_top_k_indices = similarities.argsort()[-initial_top_k:][::-1]

        # Filter based on genres dynamically if 'Genres' is specified in input_keywords
        if 'Genres' in input_keywords and isinstance(input_keywords['Genres'], list):
            genre_keywords = [g.lower() for g in input_keywords['Genres']]
            final_top_k_indices = [
                idx for idx in initial_top_k_indices
                if any(g.lower() in map(str.lower, df.iloc[idx]['Genres']) for g in genre_keywords)
            ][:top_k]
        else:
            final_top_k_indices = initial_top_k_indices[:top_k]

        # Skip if no final matches after filtering
        if not final_top_k_indices:
            continue

        # Collect results
        confidence_score = np.clip(np.max(similarities), -1.0, 1.0)
        top_k_results = df.iloc[final_top_k_indices]
        top_k_similarities = similarities[final_top_k_indices]

        results.append({
            'results': top_k_results[['id', 'Title', 'Genres', 'Poster', 'Year', 'Synopsis', 'Director', 'Producers', 'Writers', 'Cast']].to_dict(orient='records'),
            'scores': top_k_similarities.tolist(),
            'confidence': float(confidence_score)
        })

    print('Returning results:', results)
    return results

sentiment_mapping = {
    0: 'Positive',
    1: 'Negative',
    2: 'Neutral'
}

def clean_string(text):
    if not isinstance(text, str):
        return text
    text = re.sub(r'\([^)]*\)', '', text)
    text = re.sub(r'[^\w\s.]', '', text)
    sentences = text.split('.')
    sentences = [sentence.strip() for sentence in sentences if sentence.strip()]
    return ' '.join(sentences)

def predict_sentiments(texts):
    encoded_inputs = tokenizer(texts, padding='max_length', truncation=True, max_length=96, return_tensors='tf')
    input_ids = encoded_inputs['input_ids']
    token_type_ids = encoded_inputs['token_type_ids']
    attention_mask = encoded_inputs['attention_mask']
    
    # Sentiment prediction
    predictions = sentiment_model.predict([input_ids, token_type_ids, attention_mask])
    predicted_classes = np.argmax(predictions, axis=1)
    mapped_predictions = [sentiment_mapping[class_index] for class_index in predicted_classes]
    
    return mapped_predictions

@app.route('/recommend', methods=['POST'])
def recommend():
    """Endpoint to handle recommendation requests."""
    data = request.json
    input_keywords = data.get('input_keywords', {})
    top_k = data.get('top_k', 9)

    print(f'Received input keywords: {input_keywords}')
    print(f'Top K: {top_k}')

    if not input_keywords:
        return jsonify({'status': 'error', 'message': 'No input keywords provided'}), 400

    try:
        recommendations = semantic_search(input_keywords, document, top_k=top_k)
        return jsonify({'status': 'success', 'recommendations': recommendations})
    except ValueError as e:
        print('ValueError:', str(e))
        return jsonify({'status': 'error', 'message': str(e)}), 400
    except Exception as e:
        print('Unexpected error:', str(e))
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/get_sorted_movies', methods=['GET'])
def get_sorted_movies():
    try:
        # Load the reviews data from the JSON file
        with open('../frontend/src/assets/reviews.json', 'r', encoding='utf-8') as file:
            all_reviews_data = json.load(file)

        movies_dict = {movie['id']: movie for movie in data}

        # List to store movies with calculated sentiment scores
        sorted_movies = []

        for movie in all_reviews_data:
            movie_id = movie['id']

            # Extract and clean reviews for sentiment analysis
            reviews = [clean_string(review['Review']) for review in movie['Reviews']]

            # Classify sentiments for each review
            predictions = predict_sentiments(reviews)

            # Count sentiments
            positive_count = sum(1 for sentiment in predictions if sentiment == 'Positive')
            neutral_count = sum(1 for sentiment in predictions if sentiment == 'Neutral')
            negative_count = sum(1 for sentiment in predictions if sentiment == 'Negative')

            # Calculate score for sorting (favor positive and neutral reviews)
            score = (positive_count * 2) + neutral_count - (negative_count * 2)

            # Fetch additional metadata from movies.json using movie_id
            movie_metadata = movies_dict.get(movie_id, {})

            # Combine score, reviews, and metadata
            sorted_movies.append({
                'id': movie_id,
                'Title': movie['Title'],
                'Score': score,
                #'Reviews': movie['Reviews'],
                'Poster': movie_metadata.get('Poster'),
                'Genres': movie_metadata.get('Genres'),
                'Year': movie_metadata.get('Year'),
                'Synopsis': movie_metadata.get('Synopsis'),
                'Director': movie_metadata.get('Director'),
                'Producers': movie_metadata.get('Producers'),
                'Writers': movie_metadata.get('Writers'),
                'Cast': movie_metadata.get('Cast')
            })

        # Sort movies based on the calculated score
        sorted_movies = sorted(sorted_movies, key=lambda x: x['Score'], reverse=True)

        # Limit to the top 20 movies
        sorted_movies = sorted_movies[:21]

        # Return the sorted movies with scores and metadata
        return jsonify({'status': 'success', 'sorted_movies': sorted_movies})

    except Exception as e:
        print('Error during sorting:', str(e))
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/classify_reviews', methods=['GET', 'POST'])
def classify_reviews():
    try:
        # Retrieve id from the request
        movie_id = request.args.get('id') or request.json.get('id')

        if not movie_id:
            return jsonify({'status': 'error', 'message': 'No movie ID provided'}), 400

        # Check if this movie_id is already in the cache
        if movie_id in sentiment_cache:
            return jsonify({'status': 'success', 'classified_reviews': sentiment_cache[movie_id]})

        # Load the reviews data from the JSON file
        with open('../frontend/src/assets/reviews.json', 'r', encoding='utf-8') as file:
            all_reviews_data = json.load(file)

        # Find the reviews for the specified movie_id
        movie_data = next((movie for movie in all_reviews_data if movie['id'] == int(movie_id)), None)

        if not movie_data:
            return jsonify({'status': 'error', 'message': f'No data found for movie ID: {movie_id}'}), 404

        # Extract and clean reviews
        reviews = [clean_string(review['Review']) for review in movie_data['Reviews']]

        if not reviews:
            return jsonify({'status': 'error', 'message': f'No reviews found for movie ID: {movie_id}'}), 404

        # Predict sentiments for the reviews
        predictions = predict_sentiments(reviews)

        # Add the sentiment predictions to the reviews
        for idx, review in enumerate(movie_data['Reviews']):
            review['Sentiment'] = predictions[idx]

        # Store in cache
        sentiment_cache[movie_id] = movie_data

        # Return the modified movie data with predicted sentiments
        return jsonify({'status': 'success', 'classified_reviews': movie_data})

    except Exception as e:
        print('Error during classification:', str(e))
        return jsonify({'status': 'error', 'message': str(e)}), 500

if __name__ == '__main__':
    app.run(port=5000, debug=True)
