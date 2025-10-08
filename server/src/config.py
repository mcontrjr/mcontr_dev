"""
Configuration constants for the financial statement parsing service.
"""
import os

# CORS Configuration
CORS_ORIGINS = [
    "https://mcontr.dev",       # Production domain
    "http://mcontr.dev",        # Production domain (HTTP)
    "http://localhost:5173",    # Vite dev server
    "http://localhost:3000",    # React default
    "http://localhost:8080",    # Vue default
    "http://localhost:4200",    # Angular default
    "http://127.0.0.1:5173",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:8080",
    "http://127.0.0.1:4200",
]

CORS_METHODS = ["GET", "POST", "PUT"]

# File Upload Configuration
MAX_FILE_SIZE_MB = int(os.getenv('MAX_FILE_SIZE_MB', '10'))
MAX_FILE_SIZE = MAX_FILE_SIZE_MB * 1024 * 1024  # Convert to bytes
ALLOWED_FILE_TYPES = ["application/pdf"]
UPLOAD_DIRECTORY = os.getenv('UPLOAD_DIRECTORY', './uploads')

# Database Configuration
DB_CONFIG = {
    'dbname': os.getenv('DB_NAME'),
    'user': os.getenv('DB_USER'),
    'password': os.getenv('DB_PASSWORD'),
    'host': os.getenv('DB_HOST', 'localhost'),
    'port': os.getenv('DB_PORT', '5432')
}

# Category Keywords for Transaction Categorization
CATEGORY_KEYWORDS = {
    'GAS': ['GAS', 'CHEVRON', 'SHELL'],
    'LOANS': ['DEPT EDUCATION STUDENT LN', 'TOYOTA ACH RTL'],
    'RENT': ['APPFOLIO', 'MAGNIFY REAL EST'],
    'TRAVEL': ['AMERICAN AI', 'TRIP', 'HOTEL', 'TOLLS', 'DOUBLETREE', 'AIRLINE', 'RENTAL CAR', 'EXPEDIA', 'HERTZ', 'ALAMO', 'AVIS', 'RENT A CAR', 'LYFT', 'COT*FLT', 'SOUTHWES', 'SOUTHWEST'],
    'PAYPAL': ['PAYPAL'],
    'AMAZON': ['AMAZON'],
    'GROCERIES': ['TRADER JOE', 'WHOLEF', 'SPROUTS'],
    'TARGET': ['TARGET'],
    'FOOD': ['SALAD', 'LA VICTORIA SANTA', 'CHINESE FOOD', 'CHICKEN', 'DOMINO\'S', 'FRUIT', 'BERRIES', 'CREPE', 'GREAT WHITE MELROSE', 'YARD HOUSE', 'PALETERIA', 'JACK IN THE BOX', 'COFFEE', 'SAFEWAY', 'IL FORNAIO', 'KEBAB', 'BBQ', 'CHIPOTLE', 'STARBUCKS', 'EATALY', 'CAFE', 'TEA', 'DUNKIN', 'DISH', 'HOUSE OF BAGELS', 'THE MELT', 'DOORDASH', 'MENDOCINO', 'PRUNEYARD CINEMAS', 'PANDA EXPRESS', 'PIZZA', 'TACOS', 'BURGER', 'RESTAURANT', 'NOLA'],
    'AUTO': ['GEICO', 'TOYOTA'],
    'COSTCO': ['COSTCO'],
    'STREAMING': ['NETFLIX', 'PARAMOUNT+', 'DISNEYPLUS', 'PEACOCKTV'],
    'PHARMACY': ['PHARMACY', 'CVS', 'WALGREENS'],
    'GYM': ['MOVEMENT'],
    'ACTIVITIES': ['BOWLING', 'ESCAPE ROOM', 'MUSEUM', 'YOGA', 'GOLF', 'SKATE', 'ZOO', 'AQUARIUM', 'KAYAK', 'SNOW.COM/VAIL', 'SKI', 'MLB*SF GIANTS', 'GIANTS'],
    'INTERNET': ['INTERNET', 'XFINITY', 'SONIC.NET'],
    'LAUNDRY': ['KIOSOFT'],
    'APPLE PAY': ['APLPAY'],
    'PARKING': ['PARKING', 'PARKING GARAGE', 'SMART METERS'],
    'PAYMENT': ['PYMT', 'PAYMENT', 'PMT'],
    'DEPOSIT': ['ELECTRONIC DEPOSIT'],
    'ATM': ['ATM WITHDRAWAL'],
    'UTILITIES': ['PGANDE'],
    'SHOPPING': ['ANTHROPOLOGIE', 'BATH AND BODY WORKS', 'LULULEMON', 'MICHAELS STORES', 'SEPHORA', 'CRAP EYEWEAR'],
}

# API Configuration
API_VERSION = "1.0.0"
API_TITLE = "FastAPI for mcontr.dev"

# Logging Configuration
LOG_LEVEL = os.getenv('LOG_LEVEL', 'INFO').upper()
LOG_FORMAT = '%(asctime)s - %(levelname)s - %(message)s'

# Error Messages
ERROR_MESSAGES = {
    'RECORDS_RETRIEVAL': 'Error retrieving records from database',
    'FILE_PROCESSING': 'Error processing PDF files',
    'SYSTEM_INFO': 'Error retrieving system information',
    'RECORDS_CLEARING': 'Error clearing records from database',
    'CATEGORIES_RETRIEVAL': 'Error retrieving categories'
}
