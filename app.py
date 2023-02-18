from flask import Flask
import requests
import json
from PIL import Image
from pyzbar.pyzbar import decode
from flask import render_template


app = Flask(__name__)


@app.route("/")
def hello_world():
    return "<p>Hello, World!</p>"



app = Flask(__name__)

@app.route('/hello/')
def hello():
    return render_template('index.html')

@app.route('/rxcuis_to_interactions/<rxcuis>')
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

"""
@app.route('name_/<names_string>')
def getId(names_string):
    names = names_string.split('+')
#def getId(names):
    rxcuis = ""
    for name in names:
        r = requests.get('https://rxnav.nlm.nih.gov/REST/rxcui.json?name=' + name + '&search=1')
        print(r.status_code)
        response_json = r.json()
        rxcuis += response_json['idGroup']['rxnormId'][0] + "+"
    return rxcuis[0:len(rxcuis) - 2]
"""

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
# able to go from brand name to rxcui
def brand_to_rxcui(brand_name):
    base_url = "https://rxnav.nlm.nih.gov/REST/drugs.json?name="
    r = requests.get(base_url + brand_name)
    response = r.json()
    # get the rxcui from the nested json of a brand_name
    rxcui = response["drugGroup"]['conceptGroup'][1]["conceptProperties"][0]["rxcui"]
    return rxcui

@app.route('/image_to_rxcui/<image_name>')
# able to go from image to rxcui
def image_to_rxcui(image_name):
    img = Image.open(image_name)
    decoded_list = decode(img)
    parsed_product_upc = str(int(decoded_list[0][0]))
    upc_base_url = "https://ean-db.com/api/v1/product/"
    headers={ 'Authorization ' : 'eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJjNWYxMDBiZC04YjdiLTQ5MDctODNmMy1kZTk3OGViM2NmODciLCJpc3MiOiJjb20uZWFuLWRiIiwiaWF0IjoxNjc2Njk2NDk2LCJleHAiOjE3MDgyMzI0OTZ9.zxOi9OggcPaHb5cmKuolwNYRry-QL4ICf9Wrou5jHzNaZOhxXexGM8B9JL2JIq4SFo1sxzy9bhVVysa6Eo-hKg'}

    r = requests.get(upc_base_url + parsed_product_upc, headers={'Content-Type':'application/json',
               'Authorization': 'Bearer {}'.format('eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJjNWYxMDBiZC04YjdiLTQ5MDctODNmMy1kZTk3OGViM2NmODciLCJpc3MiOiJjb20uZWFuLWRiIiwiaWF0IjoxNjc2Njk2NDk2LCJleHAiOjE3MDgyMzI0OTZ9.zxOi9OggcPaHb5cmKuolwNYRry-QL4ICf9Wrou5jHzNaZOhxXexGM8B9JL2JIq4SFo1sxzy9bhVVysa6Eo-hKg')})
    response = r.json()
    full_product_name = response['product']['titles']['en']
    brand = full_product_name.split(' ')[0]
    return brand

#@app.route('/confirm_brand/<query>')