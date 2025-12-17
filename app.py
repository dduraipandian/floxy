import json

from typing import Type

from flask import Flask, request, jsonify
from flask import render_template

app = Flask("No Code Function platform",
            static_url_path='/',
            static_folder='',
            template_folder='')

@app.route("/")
def index():
    return render_template("templates/index.html")


@app.route("/<component>")
def data(component):
    return render_template(f"templates/{component}.html")

@app.route("/so")
def split():
    return render_template("templates/split_original.html")

if __name__ == "__main__":
    app.run(port=5001, debug=True)