from flask import Flask, request, jsonify
from flask_cors import CORS
from sklearn.metrics.pairwise import cosine_similarity
from scipy.optimize import minimize
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
    """Performs semantic search using cosine similarity based on input keywords."""
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

        # Compute cosine similarity
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
    
    # Perform prediction
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
        # Load the reviews and metadata
        with open('../frontend/src/assets/reviews.json', 'r', encoding='utf-8') as file:
            all_reviews_data = json.load(file)

        with open('../frontend/src/assets/movies.json', 'r', encoding='utf-8') as file:
            movies_data = json.load(file)
            movies_dict = {movie['id']: movie for movie in movies_data}

        # Data processing
        sentiment_counts = []

        for movie in all_reviews_data:
            movie_id = movie['id']

            # Clean and predict sentiments for reviews
            reviews = [clean_string(review['Review']) for review in movie['Reviews']]
            predictions = predict_sentiments(reviews)

            # Count sentiment types
            positive_count = predictions.count('Positive')
            neutral_count = predictions.count('Neutral')
            negative_count = predictions.count('Negative')
            total_count = len(predictions)

            sentiment_counts.append({
                'id': movie_id,
                'Positive': positive_count,
                'Neutral': neutral_count,
                'Negative': negative_count,
                'Total': total_count
            })

        # Convert to DataFrame for Bayesian weighting
        sentiment_counts_df = pd.DataFrame(sentiment_counts)

        # Global averages for Bayesian weighting
        global_positive_mean = sentiment_counts_df['Positive'].sum() / sentiment_counts_df['Total'].sum()
        global_neutral_mean = sentiment_counts_df['Neutral'].sum() / sentiment_counts_df['Total'].sum()
        global_negative_mean = sentiment_counts_df['Negative'].sum() / sentiment_counts_df['Total'].sum()

        # Calculate ratios for dynamic initial weights
        total_counts = sentiment_counts_df['Total'].sum()
        positive_ratio = sentiment_counts_df['Positive'].sum() / total_counts
        neutral_ratio = sentiment_counts_df['Neutral'].sum() / total_counts
        negative_ratio = sentiment_counts_df['Negative'].sum() / total_counts

        # Update initial weights
        initial_weights = [positive_ratio, neutral_ratio, -negative_ratio]

        # Optimization for weights
        def bayesian_score(row, global_positive_mean, global_neutral_mean, global_negative_mean, weights, weight):
            return (
                ((row['Positive'] + global_positive_mean * weights['positive']) / (row['Total'] + weight)) +
                ((row['Neutral'] + global_neutral_mean * weights['neutral']) / (row['Total'] + weight)) +
                ((row['Negative'] + global_negative_mean * weights['negative']) / (row['Total'] + weight))
            )

        def optimize_weights(sentiment_counts, global_positive_mean, global_neutral_mean, global_negative_mean):
            def objective_function(params):
                weights = {'positive': params[0], 'neutral': params[1], 'negative': params[2]}
                scores = sentiment_counts.apply(
                    bayesian_score,
                    axis=1,
                    global_positive_mean=global_positive_mean,
                    global_neutral_mean=global_neutral_mean,
                    global_negative_mean=global_negative_mean,
                    weights=weights,
                    weight=weight
                )
                return -np.corrcoef(scores, sentiment_counts['Total'])[0, 1]

            result = minimize(
                objective_function,
                initial_weights,
                bounds=bounds
            )
            return {'positive': result.x[0], 'neutral': result.x[1], 'negative': result.x[2]}

        # Initial bounds
        bounds = [(0, 1), (0, 1), (-1, 0)]
        weight = sentiment_counts_df['Total'].mean() / 2

        # Optimise weights
        optimal_weights = optimize_weights(
            sentiment_counts_df,
            global_positive_mean,
            global_neutral_mean,
            global_negative_mean
        )

        # Calculate Bayesian scores
        sentiment_counts_df['Score'] = sentiment_counts_df.apply(
            bayesian_score,
            axis=1,
            global_positive_mean=global_positive_mean,
            global_neutral_mean=global_neutral_mean,
            global_negative_mean=global_negative_mean,
            weights=optimal_weights,
            weight=weight
        )

        # Sort by score
        sentiment_counts_df = sentiment_counts_df.sort_values(by='Score', ascending=False)

        # Add metadata to sorted movies
        sorted_movies = []
        for _, row in sentiment_counts_df.iterrows():
            movie_metadata = movies_dict.get(row['id'], {})
            sorted_movies.append({
                'id': row['id'],
                'Title': movie_metadata.get('Title'),
                'Score': row['Score'],
                'Poster': movie_metadata.get('Poster'),
                'Genres': movie_metadata.get('Genres'),
                'Year': movie_metadata.get('Year'),
                'Synopsis': movie_metadata.get('Synopsis'),
                'Director': movie_metadata.get('Director'),
                'Producers': movie_metadata.get('Producers'),
                'Writers': movie_metadata.get('Writers'),
                'Cast': movie_metadata.get('Cast'),
                'Positive': row['Positive'],
                'Neutral': row['Neutral'],
                'Negative': row['Negative'],
                'Total': row['Total']
            })

        # Return the top 20 sorted movies
        return jsonify({'status': 'success', 'sorted_movies': sorted_movies[:21]})

    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)})

@app.route('/classify_reviews', methods=['GET', 'POST'])
def classify_reviews():
    try:
        # Retrieve movie_id from the request
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

        # Cache the result for this movie_id
        sentiment_cache[movie_id] = movie_data

        # Return the modified movie data with predicted sentiments
        return jsonify({'status': 'success', 'classified_reviews': movie_data})

    except Exception as e:
        print('Error during classification:', str(e))
        return jsonify({'status': 'error', 'message': str(e)}), 500

if __name__ == '__main__':
    app.run(port=5000, debug=True)