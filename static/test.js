/**
 * runs the thing
 */

"use strict";
(function() {
  window.addEventListener("load", init);
  const BASE_URL = "http://127.0.0.1:5000/";
  let rxcuiArray = [];
  if (document.cookie == "") {
    document.cookie = "c=true";
    document.cookie = "m=[]";
  }

  /**
   * sets up necessary functionality when page loads
   */
  function init() {
    // just deal with the instance of adding one item to our table
    let generateButton = qs("button");
    console.log(generateButton);
    generateButton.addEventListener("click", addItem);
  }

  async function addItem() {
    // 1 check if the search bar is empty
    let query = qs("input").value;
    console.log(query)
    if (query == "") {
      return console.log("no input query");
      return;
    }

    // 2 check if the search is a generic name
    // make query call to search API. return error if not contained
    let rxcui = await getGenericToRxcui(query);
    // if no rxcui found directly, search brand name
    if (rxcui === undefined) {
      console.log("I am waiting to get the brand to rxcui")
      rxcui = await getBrandToRxcui(query);
    }
    if (rxcui == "") {
    }
    rxcuiArray.push(rxcui);
    addMedCookie(rxcui, query, false);
    //3 add to the table

  }

  function addMedCookie(rxcui, name, generic) {
    let arr = parseMedCookie();
    const newMed = {rxcui: rxcui, name: name, generic: generic};
    arr.push(newMed);
    setMedCookie(arr);
    console.log(document.cookie);
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
     let c = document.cookie;
     let ca = c.split(";");
     return JSON.parse(ca[1].substring(3));
  }

  function parseConsentCookie() {
    let c = document.cookie;
    let ca = c.split(";");
    return ca[0].substring(2) == 'true';
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
      .then(resp => console.log(resp))
      .then(resp => rxcui = resp)
      .catch(handleError);
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
      .then(resp => console.log(resp))
      .then(resp => rxcui = resp)
      .catch(handleError);
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
      throw new Error(await res.text());
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
