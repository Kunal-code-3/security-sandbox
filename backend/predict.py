import sys
import json
import os
import string
import pickle
import warnings
warnings.filterwarnings('ignore')
import nltk

# Ensure NLTK data directories exist quietly
try:
    nltk.data.find('tokenizers/punkt')
except LookupError:
    nltk.download('punkt', quiet=True)

try:
    nltk.data.find('tokenizers/punkt_tab')
except LookupError:
    nltk.download('punkt_tab', quiet=True)

try:
    nltk.data.find('corpora/stopwords')
except LookupError:
    nltk.download('stopwords', quiet=True)

from nltk.corpus import stopwords
from nltk.stem.porter import PorterStemmer

ps = PorterStemmer()

def transform_text(text):
    text = text.lower()
    tokens = nltk.word_tokenize(text)

    # 1. Filter alphanumeric
    y = [i for i in tokens if i.isalnum()]

    # 2. Remove stopwords & punctuation
    stop_words = set(stopwords.words('english'))
    y = [i for i in y if i not in stop_words and i not in string.punctuation]

    # 3. Stemming
    stemmed = [ps.stem(i) for i in y]

    return " ".join(stemmed), stemmed

def main():
    try:
        if len(sys.argv) > 1:
            raw_input = sys.argv[1]
        else:
            raw_input = sys.stdin.read()

        if not raw_input.strip():
            print(json.dumps({"error": "Empty text provided"}))
            return

        # Handle JSON input if passed as object, else treat as raw string
        try:
            parsed = json.loads(raw_input)
            if isinstance(parsed, dict) and "text" in parsed:
                text = parsed["text"]
            else:
                text = str(raw_input)
        except Exception:
            text = str(raw_input)

        script_dir = os.path.dirname(os.path.abspath(__file__))
        vectorizer_path = os.path.join(script_dir, 'vectorizer.pkl')
        model_path = os.path.join(script_dir, 'model.pkl')

        if not os.path.exists(vectorizer_path) or not os.path.exists(model_path):
            print(json.dumps({"error": "Model files missing in backend directory"}))
            return

        with open(vectorizer_path, 'rb') as f:
            vectorizer = pickle.load(f)

        with open(model_path, 'rb') as f:
            model = pickle.load(f)

        transformed_str, stemmed_tokens = transform_text(text)
        vector_input = vectorizer.transform([transformed_str])
        prediction = int(model.predict(vector_input)[0])
        is_spam = bool(prediction == 1)

        # Get probability if available
        confidence = None
        if hasattr(model, "predict_proba"):
            probs = model.predict_proba(vector_input)[0]
            confidence = round(float(probs[prediction]) * 100, 1)

        result = {
            "success": True,
            "is_spam": is_spam,
            "prediction": prediction,
            "label": "Spam" if is_spam else "Not Spam",
            "confidence": confidence,
            "transformed_text": transformed_str,
            "stemmed_tokens": stemmed_tokens
        }

        print(json.dumps(result))

    except Exception as e:
        print(json.dumps({"error": str(e)}))

if __name__ == '__main__':
    main()
