# TreeHacks 2023
TreeHacks repository
This is an accessible tool to compare if medications taken together will cause adverse
reactions. We use the NIH's Drug Interaction API for the most reliable and up-to-date
data on this topic.

Home Page:
First opens on a home page that allows them to search for medications and add them to
the search query. The user can search in 2 formats: manual typing and photo input.

TODO: HOW TO HANDLE PHOTO INPUT?
If the photo input, there is a degree of error, so possible fuzzy search
application.

Text Bar:
When a query is selected by the computer, it is shown in the text bar and is
still required to be manually aded by the user.

Add Button:
Upon clicking the add button, the app should put the medication name into a table
of added medications below. The table rows should denote each medication chosen.
There first column should be the generic name, and the second column is
optionally the generic name iff this was the query inputted by the user. Do not
allow the user to add a name that is empty, longer than 50 characters, or not
identified as a medication. TODO: How to identify that something is on the list?

Clear Button:
There is a clear button around the add button called clear. This will clear
all text on the input line of the search bar.

Submit Button:
Once the user is satisfied with their medications list, they press the "Submit
Form" button to see their medication overlap.

Reset Button:
Around the "Submit" button there
must be a "Reset All" button to clear all medications on the list.
