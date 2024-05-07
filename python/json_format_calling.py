import requests
import json
import sys
# from haversine import haversine

country = sys.argv[1]

schema = {
    "city": {
        "type": "string",
        "description": "The name of the city",
    },
    "lat": {
        "type": "float",
        "description": "The decimal latitude of the city",
    },
    "lon": {
        "type": "float",
        "description": "The decimal longitude of the city",
    },
}

payload = {
    "model": "llama2",
    "messages": [
        {"role": "system", "content": f"You are a helpful AI assistant. The user will enter a country name and the assistant will return the decimal latitude and longitude of the capital of that country. Output in JSON using the schema defined here: {schema}."},
        {"role": "user", "content": "Germnay"},
        {"role": "assistant", "content": "{\"city\": \"Berlin\", \"lat\": 52.52, \"lon\": 13.405}"},
        {"role": "user", "content": country},
    ],
    "format": "json",
    "stream": False,
    "options": {
        "temperature": 0.0,
    },
}

response = requests.post("http://localhost:11434/api/chat", json=payload)

cityInfo = json.loads(response.json()["message"]["content"])
print(json.dumps(cityInfo, indent=4))
