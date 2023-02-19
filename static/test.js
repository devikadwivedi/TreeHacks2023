/**
 * runs the thing
 */

"use strict";
(function() {
  window.addEventListener("load", init);
  const BASE_URL = "http://10.21.51.146:5000/";
  let rxcuiArray = [];

  /**
   * sets up necessary functionality when page loads
   */
  function init() {
    // initialize the table from cookies

    // on click of the add button
    let add_button = id("add_button");
    add_button.addEventListener("click", addItem);
    // just deal with the instance of adding one item to our table
    let generateButton = qs("button");
    generateButton.addEventListener("click", addItem);
    let removeAll = id("remove_all");
    removeAll.addEventListener("click", removeAllQueries);

    //document.cookie = "m=[]";

    if (getCookie("c") == "") {
        document.cookie = "c=true;expires=" + expireDate();
    }
    if (getCookie("m") == "") {
        document.cookie = "m=[];expires=" + expireDate();
    }

    let arr = parseMedCookie();
    for (let i = 0; i < arr.length; i++) {
        addItemFromQuery(arr[i].query);
    }
    console.log(document.cookie);
  }

  /**
   * Ensure that query is not empty + not duplicated generic name
   * @param {String} query the user's medication name input
   * @returns boolean representing if the input is valid
   */
  function validateInput(query) {
    if (query == "") {
      return console.log("Error: no input query");
      return false;
    }
    // check if the input is a duplicate.
    return true;
  }

  function removeAllQueries() {
    // clear the rxcuiArray
    rxcuiArray = [];
    // clear the medications
    clearMedications();
    // clear the interactions
    clearInteractions();
    // clear cookies
    removeAllMedCookie();
  }


  /**
   * given a generic name or brand name, find the rxcui and add it to array
   * @param {Ftring} query is the user's medication input
   * @returns the rxcui if found or null if not found
   */
  async function getRxcui(query) {
    let rxcui;
    rxcui = await getGenericToRxcui(query);
    if (rxcui == "") {
      console.log("I am waiting to get the brand to rxcui")
      rxcui = await getBrandToRxcui(query);
    }

    if (rxcui == "") {
      console.log("error: medication not found");
      return null;
    }

    if (rxcuiArray.filter(e => e.rxcui === rxcui).length == 0) {
        rxcuiArray.push({rxcui: rxcui, query: query});
        addMedCookie(rxcui, query);
        return rxcui;
    }
    return null;
  }

  function clearMedications() {
    let medications = id("medications");
    medications.innerHTML = "";
    let listElement = gen("li");
    listElement.classList.add("notifElement");

    let newImage = gen("img");
    newImage.src = "/static/Minus.png";
    newImage.alt = "photo of cross";
    newImage.classList.add("icon");


    let newDiv = gen("div");
    newDiv.innerHTML = "No medications added at this time.";
    listElement.appendChild(newImage);
    listElement.appendChild(newDiv);
    medications.appendChild(listElement);
  }

  function clearInteractions() {
    let notifications = id("notifications");
    notifications.innerHTML = "";
    // no interactions:
    let listElement = gen("li");
    listElement.classList.add("notifElement");
    let newImage = gen("img");
    newImage.src = "/static/Notify.png";
    newImage.alt = "photo of exclamation mark";
    newImage.classList.add("icon");

    let newDiv = gen("div");
    newDiv.innerHTML = "No notifications at this time";
    listElement.appendChild(newImage);
    listElement.appendChild(newDiv);
    notifications.appendChild(listElement);
  }
  async function getInteractions(query) {
    if (rxcuiArray.length > 1) {
      let medication_string = rxcuiArray[0].rxcui;
      for (let i = 1; i < rxcuiArray.length; i++) {
        medication_string += "+" + rxcuiArray[i].rxcui;
      }
      let interaction_set = await getRxcuiToInteractions(medication_string);

      let notifications = id("notifications");
      notifications.innerHTML = "";
      if (interaction_set.length < 1) {
        // no interactions:
        clearInteractions();
      }
      for (let i = 1; i < interaction_set.length; i++) {
        // put into the page
        let listElement = gen("li");
        listElement.classList.add("notifElement");

        let newImage = gen("img");
        newImage.src = "/static/warning.png";
        newImage.alt = "photo of exclamation mark";
        newImage.classList.add("icon");
        newImage.onclick = getInteractionToGPT;
        newImage.id = interaction_set[i];


        let newDiv = gen("div");
        newDiv.innerHTML = interaction_set[i];
        listElement.appendChild(newImage);
        listElement.appendChild(newDiv);
        notifications.appendChild(listElement);
      }
    }
  }

  function addToPage(query) {
    let medications = id("medications");
    if (rxcuiArray.length === 1) {
      medications.innerHTML = "";
    }
    let listElement = gen("li");
    listElement.classList.add("notifElement");

    let newImage = gen("img");
    newImage.src = "/static/Minus.png";
    newImage.alt = "photo of cross";
    newImage.classList.add("icon");

    let newDiv = gen("div");
    newDiv.innerHTML = query;
    listElement.appendChild(newImage);
    listElement.appendChild(newDiv);
    medications.appendChild(listElement);

    id("search_bar").value = "";
  }

  async function addItem() {
    // 1 validate response
    let query = id("search_bar").value;
    if (validateInput(query) == false) {
      console.log("input rejected");
      return;
    }
    addItemFromQuery(query);
  }

  async function addItemFromQuery(query) {
    // 2 check if the search is a generic name
    let rxcui = await getRxcui(query);
    if (rxcui === null) {
      return;
    }
    //3 add to the table and clear search bar
    addToPage(query);
    getInteractions(query);
    id("search_bar").value = "";
  }

  async function removeItem(rxcui) {
    rxcuiArray = rxcuiArray.filter(e => e.rxcui !== rxcui);
    removeMedCookie(rxcui);
  }

  async function toggleCookieConsent() {
    if (parseConsentCookie()) {
        setConsentCookie(false);
    } else {
        setConsentCookie(true);
    }
  }

  async function getRxcuiToInteractions(rxcuis) {
    let url = BASE_URL + "/rxcuis_to_interactions/" + rxcuis;
    console.log(url);
    let interaction_set;
    await fetch(url)
      .then(statusCheck)
      .then(resp => resp.text())
      .then((resp) => {
        interaction_set = resp;
        })
      .catch(handleError);
      let myArray = interaction_set.split("@");
      return myArray;
  }

  function addMedCookie(rxcui, query) {
    if (parseConsentCookie()) {
        let arr = parseMedCookie();
        if (parseMedCookie().filter(e => e.rxcui === rxcui).length == 0) {
            const newMed = {rxcui: rxcui, query: query};
            arr.push(newMed);
            setMedCookie(arr);
            console.log(document.cookie);
        }
    }
  }

  function removeMedCookie(rxcui) {
    let arr = parseMedCookie();
    let newArr = arr.filter(function(e) {e => e.rxcui !== rxcui});
    setMedCookie(newArr);
  }

  function removeAllMedCookie() {
    setMedCookie([]);
  }

  function setMedCookie(arr) {
    document.cookie = "m=" + JSON.stringify(arr) + ";expires=" + expireDate();
  }

  function setConsentCookie(consent) {
    if (typeof consent === 'boolean') {
        document.cookie = "c=" + String(consent) + "expires=" + expireDate();
        if (!consent) {
            // Remove all stored medical data if consent withdrawn
            removeAllMedCookie();
        }
    }
  }

  function parseMedCookie() {
     let m = getCookie("m");
     return JSON.parse(m);
  }

  function parseConsentCookie() {
    let c = getCookie("c");
    return c == 'true';
  }

  function getCookie(cname) {
    let name = cname + "=";
    let decodedCookie = decodeURIComponent(document.cookie);
    let ca = decodedCookie.split(';');
    for(let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) == ' ') {
        c = c.substring(1);
      }
      if (c.indexOf(name) == 0) {
        return c.substring(name.length, c.length);
      }
    }
    return "";
  }

  function expireDate() {
    let date = new Date(Date.now());
    date.setFullYear(date.getFullYear() + 1);
    return date.toUTCString();
  }

  /**
   * takes the med name query and returns if the rxcui is found
   * @param {String} type of excuse desired
   */
  async function getGenericToRxcui(query) {
    let url = BASE_URL + "generic_to_rxcui/" + query;
    let rxcui = ""
    await fetch(url)
      .then(statusCheck)
      .then(resp => resp.text())
      .then((resp) => {
        rxcui = resp;
        })
      .catch(handleError);
      console.log("genericToRxcui returns: " + rxcui);
      return rxcui;
  }

  async function getInteractionToGPT() {
    let url = BASE_URL + "/interaction_to_gpt/" + this.id;
    console.log(url);
    await fetch(url)
      .then(statusCheck)
      .then(resp => resp.text())
      .then((resp) => {
        alert(resp);
      })
      .catch(handleError);
      this.onclick = "";
  }

  /**
   * takes the med name query and returns if the brand is found
   * @param {String} type of excuse desired
   */
  async function getBrandToRxcui(query) {
    let url = BASE_URL + "brand_to_rxcui/" + query;
    let rxcui = ""
    await fetch(url)
      .then(statusCheck)
      .then(resp => resp.text())
      .then((resp) => {
        rxcui = resp
        })
      .catch(handleError);
      console.log("getBrandToRxcui returns: " + rxcui);
    return rxcui;
  }

  /**
   * gives the user a helpful message if an error occurs while requesting
   */
  function handleError() {
    // to be implemented
  }

  /**
   * Helper function to return the response's result text if successful, otherwise
   * returns the rejected Promise result with an error status and corresponding text
   * @param {object} res - response to check for success/error
   * @return {object} - valid response if response was successful, otherwise rejected
   *                    Promise result
   */
  async function statusCheck(res) {
    if (!res.ok) {
      console.log("Server Error: Not Found");
      return "";
    }
    return res;
  }

  /**
   * Returns the desired element node
   * @param {string} tag - the name of the tag to create
   * @returns {object} the desired element node
   */
  function gen(tag) {
    return document.createElement(tag);
  }

  /**
   * Returns the element that has the ID attribute with the specified value.
   * @param {string} id - element ID.
   * @returns {object} - DOM object associated with id.
   */
  function id(id) {
    return document.getElementById(id);
  }

  /**
   * Returns first element matching the given CSS selector.
   * @param {string} selector - CSS selector.
   * @returns {object} - object associated selector.
   */
  function qs(selector) {
    return document.querySelector(selector);
  }

  /**
   * Returns an array of elements that match the given CSS selector.
   *  @param {string} selector - CSS selector
   *  @returns {object[]} array of DOM objects matching the query.
   */
  function qsa(selector) {
    return document.querySelectorAll(selector);
  }

})();