import json
import hmac
import hashlib
from flask import Flask, request, send_from_directory
from telegram import Update, Bot
from telegram.ext import Updater, MessageHandler, filters
from dotenv import load_dotenv
import os

# Load environment variables from .env file
load_dotenv()

# Retrieve environment variables
SITE_ADDRESS = os.getenv("SITE_ADDRESS")
TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")

# Initialize Flask app and Telegram bot
app = Flask(__name__)
bot = Bot(TELEGRAM_BOT_TOKEN)


# Function to verify Telegram initData authenticity
def verify_init_data(init_data, bot_token):
    data_check_string = "\n".join(
        [f"{k}={v}" for k, v in sorted(init_data.items()) if k != "hash"]
    )
    secret_key = hmac.new(
        "WebAppData".encode(), bot_token.encode(), hashlib.sha256
    ).digest()
    calculated_hash = hmac.new(
        secret_key, data_check_string.encode(), hashlib.sha256
    ).hexdigest()
    return calculated_hash == init_data["hash"]


# Handle messages from Telegram
def handle_message(update: Update, context):
    if update.message.web_app_data:
        web_app_data = update.message.web_app_data
        data = json.loads(web_app_data.data)
        score = data["score"]
        init_data = data["initData"]
        init_data_dict = {
            item.split("=")[0]: item.split("=")[1] for item in init_data.split("&")
        }
        if verify_init_data(init_data_dict, bot.token):
            user = update.message.from_user
            bot.send_message(chat_id=user.id, text=f"Your score is {score}")
        else:
            print("Invalid initData received")


# Set up Telegram dispatcher
dispatcher = Dispatcher(bot, None, workers=0)
dispatcher.add_handler(MessageHandler(filters.all, handle_message))


# Serve the Snake game web page
@app.route("/snake")
def serve_snake():
    return send_from_directory("static", "snake.html")


# Handle Telegram webhook updates
@app.route("/webhook", methods=["POST"])
def webhook():
    update = Update.de_json(request.get_json(), bot)
    dispatcher.process_update(update)
    return "OK"


if __name__ == "__main__":
    # Set the webhook using the SITE_ADDRESS from the environment
    bot.setWebhook(f"{SITE_ADDRESS}/webhook")
    app.run(host="0.0.0.0", port=5000)
