from flask import Flask
import requests
import json
from PIL import Image
#from pyzbar.pyzbar import decode
from flask import render_template

app = Flask(__name__)

@app.route("/")
def hello_world():
    return "<p>Hello, World!</p>"

@app.route('/hello/')
def hello():
    return render_template('index.html')

@app.route('/rxcuis_to_interactions/<rxcui>')
def rxcuis_to_interactions(rxcui):
    # the rxcuis should be in "rxcui + rxcui + " format
    # get data from api
    url = 'https://rxnav.nlm.nih.gov/REST/interaction/list.json?rxcuis='
    r = requests.get(url + rxcui)
    # primitive error handling
    if (r.status_code != 200):
        print("Error")
        print(r.status_code)

    # fields
    response_json = r.json()
    descriptionSet = set()
    nlmDisclaimer = response_json['nlmDisclaimer']
    fip_array = response_json['fullInteractionTypeGroup'][0]['fullInteractionType']

    # loop through the items, add to set of descriptions
    for j in range (len(fip_array)):
        ip_array = fip_array[j]['interactionPair']
        for i in range (len(ip_array)):
            descriptionSet.add(ip_array[i]['description'])
    res = response_json['fullInteractionTypeGroup'][0]['fullInteractionType'][0]['interactionPair'][0]['description']


    return f'{descriptionSet}'

@app.route('/generic_to_rxcui/<generic_name>')
def generic_to_rxcui(generic_name):
    rxcuis = ""
    r = requests.get('https://rxnav.nlm.nih.gov/REST/rxcui.json?name=' + generic_name + '&search=1')

    if (r.status_code != 200):
        print("Error")
        print(r.status_code)
    response_json = r.json()
    # if we've already found it, no need to go find it again on the query, just
    # save these jsons/rxcuis and search through them
    rxcui = response_json['idGroup']['rxnormId'][0]
    return rxcuis

@app.route('/brand_to_rxcui/<brand_name>')
# brand name to rxcui
def brand_to_rxcui(brand_name):
    base_url = "https://rxnav.nlm.nih.gov/REST/drugs.json?name="
    r = requests.get(base_url + brand_name)
    response = r.json()
    # get the rxcui from the nested json of a brand_name
    rxcui = response["drugGroup"]['conceptGroup'][1]["conceptProperties"][0]["rxcui"]
    return rxcui

