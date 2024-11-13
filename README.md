# Scenario-Based Movie Recommendation System

> This is a private repository licensed for internal use only. Redistribution or public sharing of this code is prohibited without explicit permission. For more details, see the LICENSE file.

Welcome to the **Popcorn** project repository! This project demonstrates our research on scenario-based recommendation systems, showcasing an interactive movie recommendation system based on user preferences and scenarios.

## Recreate This Project

After cloning this repository to your local machine, follow the steps below to set up and run the project.

### Setting Up the Project

1. Navigate to the frontend directory:
   
    ```bash
       cd frontend
    ```
2. Install dependencies to recreate the `node_modules` folder:
   
    ```bash
        npm install
    ```
3. This project uses Chakra UI version 3.0.0. To ensure proper styling and functionality, please refer to the [Chakra UI documentation](https://www.chakra-ui.com/docs/get-started/installation) and install any additional required packages.

## Sentiment Analysis Model

The `app.py` file in the backend directory requires a `.keras` model file. Our setup utilises a Fine-Tuned BERT + CNN model, which is not included in this repository due to GitHub's file size limitations.

However, you can experiment with other available models on our GitHub account:
- [RNN](https://github.com/bitacode/Movie-Reviews-Sentiment-Classification-RNN.git)
- [LSTM](https://github.com/bitacode/Movie-Reviews-Sentiment-Classification-LSTM.git)
- [GRU](https://github.com/bitacode/Movie-Reviews-Sentiment-Classification-GRU.git)
- [TFBertForSequenceClassification](https://github.com/bitacode/Movie-Reviews-Sentiment-Classification-Fine-Tuned-BERT.git)
- [CNN](https://github.com/bitacode/Movie-Reviews-Sentiment-Classification-CNN.git)

Feel free to explore these models!

## Running the Application

> Note: Ensure the backend is running before starting the frontend.

1. **Start the backend:**
   - Open a terminal and navigate to the backend directory:
   
     ```bash
         cd backend
     ```
   - Activate your Conda environment (or create a virtual environment if you prefer not to use Conda):
     
      ```bash
         conda activate your_conda_env_name
      ```
   - Run the backend server:
     
      ```bash
         python app.py
      ```
   - Wait until you see the message **Debugger is active!** in your terminal, indicating the backend is running.

2. **Start the frontend:**
   - Open a new terminal (keeping the backend terminal open) and start the frontend:
     
     ```bash
         npm start
     ```
   - Visit [http://localhost:3000](http://localhost:3000) in your browser to access the application.
  
