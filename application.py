from flask import Flask, flash, request, redirect, url_for, render_template
import requests
from PIL import Image
#from pyzbar.pyzbar import decode
import os
import openai
from werkzeug.utils import secure_filename

#todo: make this an env var
openai.api_key = os.getenv('openai_key')

# EB looks for an 'application' callable by default.
application = Flask(__name__)
UPLOAD_FOLDER = 'static/image_uploads/'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'heic'}
application.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER


# rule for interactionToGPT
application.add_url_rule('/interaction_to_gpt/<brands>', 'interactionToGPT', (lambda brands: interaction_to_gpt(brands)))
def interaction_to_gpt(brands):
    prompt = "explain to someone with little experience with the medical system the harmful impacts of taking" + str(brands.split('+')) + "at the same time in 1 sentence. If you can, replace chemical names with drug brand names."
    response = openai.Completion.create(
        model="text-davinci-003",
        prompt=prompt,
        temperature=0.7,
        max_tokens=256,
        top_p=1,
        frequency_penalty=0,
        presence_penalty=0
    )
    print(response['choices'][0]['text'].replace('\n', ''))
    return response['choices'][0]['text'].replace('\n', '')


# rule for rxcuiToInteraction
application.add_url_rule('/rxcuis_to_interactions/<rxcuis>', 'rxcuiToInteraction', (lambda rxcuis: rxcuis_to_interactions(rxcuis)))
def rxcuis_to_interactions(rxcuis):
    # the rxcuis should be in "rxcui + rxcui + " format
    # get data from api
    url = 'https://rxnav.nlm.nih.gov/REST/interaction/list.json?rxcuis='
    r = requests.get(url + rxcuis)
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
    result = ""
    for element in descriptionSet:
        result += "@" + element

    print(result)
    return result

# rule for genericToRxcui
application.add_url_rule('/generic_to_rxcui/<generic_name>', 'genericToRxcui', (lambda generic_name: generic_to_rxcui(generic_name)))
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
    return rxcui



# rule for brandToRxcui
application.add_url_rule('/brand_to_rxcui/<brand_name>', 'brandToRxcui', (lambda brand_name: brand_to_rxcui(brand_name)))
def brand_to_rxcui(brand_name):
    base_url = "https://rxnav.nlm.nih.gov/REST/drugs.json?name="
    r = requests.get(base_url + brand_name)
    response = r.json()
    # get the rxcui from the nested json of a brand_name
    rxcui = response["drugGroup"]['conceptGroup'][1]["conceptProperties"][0]["rxcui"]
    return rxcui


# image to brand
def image_to_brand(image_name):
    image_path = UPLOAD_FOLDER + image_name

    img = Image.open(image_path)
    #scan barcode
    decoded_list = decode(img)
    os.remove(image_path)
    parsed_product_upc = str(int(decoded_list[0][0]))

    #get barcode to product from api
    upc_base_url = "https://ean-db.com/api/v1/product/"
    # TODO: make this access code an env var
    headers={ 'Authorization ' : 'eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJjNWYxMDBiZC04YjdiLTQ5MDctODNmMy1kZTk3OGViM2NmODciLCJpc3MiOiJjb20uZWFuLWRiIiwiaWF0IjoxNjc2Njk2NDk2LCJleHAiOjE3MDgyMzI0OTZ9.zxOi9OggcPaHb5cmKuolwNYRry-QL4ICf9Wrou5jHzNaZOhxXexGM8B9JL2JIq4SFo1sxzy9bhVVysa6Eo-hKg'}
    r = requests.get(upc_base_url + parsed_product_upc, headers={'Content-Type':'application/json',
               'Authorization': 'Bearer {}'.format('eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJjNWYxMDBiZC04YjdiLTQ5MDctODNmMy1kZTk3OGViM2NmODciLCJpc3MiOiJjb20uZWFuLWRiIiwiaWF0IjoxNjc2Njk2NDk2LCJleHAiOjE3MDgyMzI0OTZ9.zxOi9OggcPaHb5cmKuolwNYRry-QL4ICf9Wrou5jHzNaZOhxXexGM8B9JL2JIq4SFo1sxzy9bhVVysa6Eo-hKg')})
    response = r.json()

    #if product found, good, if not, error
    try:
        full_product_name = response['product']['titles']['en']
        brand = full_product_name.split(' ')[0]
        return brand
    except:
        print(response)
        return "error"

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def index():
    if request.method == 'POST':
        # check if the post request has the file part
        if 'file' not in request.files:
            flash('No file part')
            return redirect(request.url)
        file = request.files['file']
        # If the user does not select a file, the browser submits an
        # empty file without a filename.
        if file.filename == '':
            flash('No selected file')
            return redirect(request.url)
        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            file.save(os.path.join(application.config['UPLOAD_FOLDER'], filename))
            brand = image_to_brand(filename)
            return render_template('index.html', drug=brand)
    return render_template('index.html', drug="")

# add a rule for the index page.
application.add_url_rule('/home','index', (lambda: index()), methods=['GET', 'POST'])

def front():
    return render_template('front.html', drug="")

# add a rule for the index page.
application.add_url_rule('/','front', (lambda: front()), methods=['GET', 'POST'])



# run the app.
if __name__ == "__main__":
    # Setting debug to True enables debug output. This line should be
    # removed before deploying a production app.
    application.debug = True
    application.run()