# Project Sentinel

Project Sentinel is a comprehensive, real-time investigation management platform designed for security and surveillance operations. It empowers users to create, monitor, and analyze investigations, incorporating live data streams, image analysis, and an AI-powered voice assistant to provide actionable insights.

## Features

- **User Authentication:** Secure user registration and login functionality to ensure that only authorized personnel can access the system.
- **Investigation Management:** Create, edit, and track investigations, each with a detailed log of activities, locations, and personnel involved.
- **Live Data Capture:** Capture and save images in real-time during an investigation, providing a visual record of events as they unfold.
- **AI-Powered Image Analysis:** Leverage advanced computer vision models to analyze captured images for:
  - Face detection
  - Emotion recognition
  - Age and gender estimation
  - Vulnerability and "panic score" assessment
- **Interactive Dashboard:** A centralized dashboard that provides a high-level overview of all investigations, recent reports, and a live feed of activities.
- **AI Voice Assistant:** A voice-activated assistant that allows for hands-free operation and quick access to information.

## Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/project-sentinel.git
   cd project-sentinel
   ```

2. **Create and activate a virtual environment:**
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   ```

3. **Install the required dependencies:**
   ```bash
   pip install -r requirements.txt
   ```
   **Note:** The image analysis features require additional libraries. Please see the `requirements.txt` file for a full list of dependencies.

## Usage

1. **Set up the environment:**
   - Create a `.env` file in the root directory and add the following:
     ```
     GROQ_API_KEY=your_groq_api_key
     ```

2. **Run the application:**
   ```bash
   python run.py
   ```

3. **Access the application:**
   - Open your web browser and navigate to `http://127.0.0.1:5000`.

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.