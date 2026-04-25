# Respiratory Disease Web App Walkthrough

I have completed building the end-to-end scaffolding for your Respiratory Disease Classification Web App and Neural Network using PyTorch!

## What was Accomplished

1. **Machine Learning Pipeline (`ml/`)**:
   - `dataset.py`: A PyTorch `Dataset` that reads `.wav` files, extracts Mel-Spectrogram features using `librosa`, and maps the disease labels (Asthma, COPD, Tuberculosis, Healthy) to integers.
   - `model.py`: A PyTorch Convolutional Neural Network (CNN) specifically tailored for 2D spectrogram image inputs.
   - `train.py`: The complete training loop including training/validation split, CrossEntropy loss, Adam optimizer, and best-model checkpointing.
   - `inference.py`: A prediction class to load the saved `disease_classifier.pth` and predict the disease along with confidence scores.

2. **Web Backend (`app.py`)**:
   - Built with **FastAPI**.
   - Handles static file serving for the frontend.
   - Provides a `/predict` endpoint that receives an uploaded audio file (or recording), runs inference via the ML model, and returns the results.
   - Built to handle missing models gracefully (if the `.pth` file is not found, it runs the untrained dummy network for demonstration purposes).

3. **Web Frontend (`static/`)**:
   - `index.html`, `style.css`, `script.js`
   - A highly premium, responsive Vanilla CSS design leveraging glassmorphism, dynamic animations, and gradient text.
   - Features a **file drag-and-drop** uploader as well as a **Microphone Recording** feature using the browser's `MediaRecorder` API.
   - Clean data visualization using horizontal progress bars to show confidence scores across all classes.

4. **Environment & Scripts**:
   - Created `requirements.txt` with all necessary packages.
   - Currently running `uv pip install -r requirements.txt` in the background to set up your environment.
   - Added a `download_data.ps1` script showing how to download the Kaggle dataset using your provided API Key.

## How to Test and Run

> [!TIP]
> The dependencies are still installing in the background via `uv`. Once they finish, you can start the application!

### 1. Run the Web App (Demonstration Mode)
Even without the dataset, you can run the app to see the frontend and test the upload/recording flow. The backend will use an untrained PyTorch model to return dummy predictions.
Open your terminal in `c:\Users\ayush\Desktop\Git Projects\Cough_Identification` and run:
```bash
uv run uvicorn app:app --host 0.0.0.0 --port 8000
```
Then navigate to `http://localhost:8000` in your web browser.

### 2. Download Data and Train the Actual Model
To get real predictions, you must train the model with the dataset:
1. Open `download_data.ps1` and replace `<REPLACE_WITH_YOUR_KAGGLE_USERNAME>` with your actual Kaggle username. Run the script in PowerShell to download the data to the `./data` folder.
2. Ensure the metadata CSV is at `./data/patient_diagnosis.csv` (adjust the name based on the actual Kaggle extract).
3. Run the training script:
```bash
uv run python ml/train.py
```
4. Once training finishes, it will generate a `disease_classifier.pth` file. Restart the FastAPI server, and it will load your trained model for real predictions!
