from PIL import Image
from pyzbar.pyzbar import decode
import easyocr


img = Image.open('IMG_8021.jpg')

decoded_list = decode(img)

print(type(decoded_list))
# <class 'list'>

reader = easyocr.Reader(['en'])
result = reader.readtext('IMG_8021.jpg', detail = 0)

for res in result:
    if (len(res) > 6):
        print(res)

for dec in decoded_list:
    print(str(int(dec[0])))


