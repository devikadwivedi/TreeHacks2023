/**
 * runs the thing
 */

"use strict";
(function() {
  window.addEventListener("load", init);
  const BASE_URL = "http://127.0.0.1:5000/";
  let rxcuiArray = [];

  /**
   * sets up necessary functionality when page loads
   */
  function init() {
    // just deal with the instance of adding one item to our table
    let generateButton = qs("button");
    generateButton.addEventListener("click", addItem);
    //if (document.cookies == "") {
        document.cookie = "c=true";
        document.cookie = "m=[]";
    //}
    let date = new Date(Date.now());
    let newDate = date.setFullYear(date.getFullYear() + 1);
    document.cookie = "expires=" + date.toUTCString();
    console.log(document.cookie);
  }

  async function addItem() {
    // 1 check if the search bar is empty
    let query = qs("input").value;
    if (query == "") {
      return console.log("no input query");
      return;
    }

    // 2 check if the search is a generic name
    // make query call to search API. return error if not contained
    let rxcui = await getGenericToRxcui(query);
    // if no rxcui found directly, search brand name
    if (rxcui == "") {
      console.log("I am waiting to get the brand to rxcui")
      rxcui = await getBrandToRxcui(query);
    }
    if (rxcui == "") {
      console.log("error: medication not found");
    } else {
      rxcuiArray.push(rxcui);
      addMedCookie(rxcui, query);
    }

    //3 add to the table and clear search bar
    let added_section = id("added_meds");
    let new_p = gen("p");
    new_p = query+ " ";
    added_section.append(new_p);
    qs("input").value = "";

    // ask for interactions
    let rxcuis = "";
    rxcuiArray.forEach((indiv) => {
      console.log(indiv);
      rxcuis += indiv;
    });
    //let interaction_set = await getRxcuiToInteractions(rxcuis);
    if (rxcuiArray.length > 1) {
      console.log(rxcuiArray);
      let medication_string = rxcuiArray[0]
      for (let i = 1; i < rxcuiArray.length; i++) {
        medication_string += "+" + rxcuiArray[i];
      }
      let interaction_set = await getRxcuiToInteractions(medication_string);
      let interaction_section = id("interactions");
      if (interaction_set === undefined) {
        return;
      }
      new_p = "" + interaction_set;
      interaction_section.append(new_p);
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
      console.log("getRxcuiToInteractions returns: " + interaction_set);
      return interaction_set;
    rxcuiArray.push(rxcui);
    addMedCookie(rxcui, query, false);
    console.log(document.cookies);
    //3 add to the table

  }

  function addMedCookie(rxcui, name) {
    console.log(parseConsentCookie());
    if (parseConsentCookie()) {
        let arr = parseMedCookie();
        const newMed = {rxcui: rxcui, query: name};
        arr.push(newMed);
        setMedCookie(arr);
        console.log(document.cookie);
    }
  }

  function removeMedCookie(rxcui) {
    let arr = parseMedCookie();
    let newArr = arr.filter(function(e) {return e.rxcui !== rxcui});
    setMedCookie(newArr);
  }

  function removeAllMedCookie() {
    setMedCookie([]);
  }

  function setMedCookie(arr) {
    document.cookie = "m=" + JSON.stringify(arr);
  }

  function setConsentCookie(consent) {
    document.cookie = "c=" + String(consent);
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
    for(let i = 0; i <ca.length; i++) {
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


async function process_image() {
  const file = document.getElementById("upload-file").value
  // send this file to your api
  const response = await makeRequest(file)
  const medName = response.json().med_name
  document.getElementById("med-name").value = medName
}