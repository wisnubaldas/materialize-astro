# FastAPI Project

This is a FastAPI project structured to provide a clean and organized way to build APIs.

## Project Structure

```
fastapi-project
├── app
│   ├── main.py          # Entry point of the FastAPI application
│   ├── api              # Directory for API routes
│   │   └── __init__.py  # API route definitions
│   ├── models           # Directory for data models
│   │   └── __init__.py  # Data model definitions
│   └── schemas          # Directory for Pydantic schemas
│       └── __init__.py  # Data validation and serialization schemas
├── pyproject.toml       # Project configuration and dependencies
└── README.md            # Project documentation
```

## Setup Instructions

1. **Clone the repository:**
   ```
   git clone <repository-url>
   cd fastapi-project
   ```

2. **Create a virtual environment:**
   ```
   python -m venv venv
   ```

3. **Activate the virtual environment:**
   - On Windows:
     ```
     venv\Scripts\activate
     ```
   - On macOS/Linux:
     ```
     source venv/bin/activate
     ```

4. **Install dependencies:**
   ```
   pip install -r requirements.txt
   ```

## Usage

To run the FastAPI application, execute the following command:

```
uvicorn app.main:app --reload
```

Visit `http://127.0.0.1:8000/docs` to access the interactive API documentation.