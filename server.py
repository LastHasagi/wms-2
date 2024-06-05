from flask import Flask, request, redirect, render_template, url_for
import pandas as pd
import requests

app = Flask(__name__)

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/send-message', methods=['POST'])
def send_message():
    if 'contact_file' not in request.files:
        return redirect(request.url)

    file = request.files['contact_file']
    message = request.form['message']
    image = request.files['image']

    # Save the image
    image.save('./upload/folheto.jpg')

    # Read the Excel file
    df = pd.read_excel(file)
    # Assume that the phone numbers are in a column called 'Phone'
    to = df['to'].tolist()

    # Create the JSON object
    data = {
        'to': to,
        'message': message,
    }

    # Send the JSON object to the API
    response = requests.post('/send-message', json=data)
    
    # Redirect the user to the home page
    return redirect(url_for('home'))

if __name__ == '__main__':
    app.run(debug=True, port=3001)