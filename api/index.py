from flask import Flask, jsonify

app = Flask(__name__)

@app.route('/api/hello', methods=['GET'])
def hello():
    return jsonify({
        "status": "success",
        "message": "Hello from Vercel Python Backend!"
    })

if __name__ == "__main__":
    app.run()
