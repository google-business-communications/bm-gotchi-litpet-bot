# BUSINESS MESSAGES: BM-GOTCHI-BOT / LIT-PET

This sample demonstrates an interactive experience between a user and a bot using
the Business Messages pltaform and the Node.js SDK.

This digital agent is a virtual pet simulation game. The pet starts off in a
happy state and over time needs play time, needs to be fed, and be taken care
of.

This sample is setup to run on the Google App Engine.

See the Google App Engine (https://cloud.google.com/appengine/docs/nodejs/) standard environment
documentation for more detailed instructions.

## PREREQUISITES

You must have the following software installed on your development machine:

* [Google Cloud SDK](https://cloud.google.com/sdk/) (aka gcloud)
* [Node.js](https://nodejs.org/en/) - version 10 or above

## SETUP

Register with Business Messages:

    1.  Open [Google Cloud Console](https://console.cloud.google.com) with your
        Business Messages Google account and create a new project for your agent.

        Note the **Project ID** and **Project number** values.

    2.  Open the
        [Business Messages API](https://console.developers.google.com/apis/library/businessmessages.googleapis.com)
        in the API Library.

    3.  Click **Enable**.

    4.  [Register your project](https://developers.google.com/business-communications/business-messages/guides/set-up/register)
        with Business Messages.

    5.  Create a service account.

        1.   Navigate to [Credentials](https://console.cloud.google.com/apis/credentials).

        2.   Click **Create service account**.

        3.   For **Service account name**, enter your agent's name, then click **Create**.

        4.   For **Select a role**, choose **Project** > **Editor**, the click **Continue**.

        5.   Under **Create key**, choose **JSON**, then click **Create**.

             Your browser downloads the service account key. Store it in a secure location.

    6.  Click **Done**.

    7.  Copy the JSON credentials file into this sample's /resources
        folder and rename it to "bm-agent-service-account-credentials.json".

Create a Business Messages agent:

    *   Open the [Create an agent](https://developers.google.com/business-communications/business-messages/guides/set-up/agent)
        guide and follow the instructions to create a Business Messages agent.

Create a Firebase Realtime Database:

    1.  Open [Firebase Console](https://console.firebase.google.com/) with your Google account
        and create new Firebase project.

    2.  Select the GCP Project you used for enabling the Business Messages API above. Accept the
        Terms and Conditions, select billing type, click Continue and Add Firebase.

    3.  After the resources are provisionsed, headover to your Firebase Project. On the left
        navigation, select Develop > Realtime Database and then click **Create Database**
        and start your database in **Locked Mode**.

    4.  Your Realtime Database will then be created and a URL will be provided for you to
        reference this database. Update ./lib/firebase_helper.js `https://FIREBASE_REALTIME_DATABASE_URL`
        to match the URL provided by Realtime Database in Firebase.

Create a Firebase Service Account.

    1.  Return to the [GCP Developer Console](https://console.cloud.google.com) and open the
        respective project used for Business Messages.

    2.  Navigate to [Credentials](https://console.cloud.google.com/apis/credentials).

    3.  In Service Accounts, a new entry should have been added for Firebase named
        `firebase-adminsdk`.
        Click it to open the service account details.

    4.  Under **Add Key** > **Create new key**, choose **JSON**, then click **Create**.

    5.  Your browser downloads the service account key. Store it in a secure location.

    6.  Click **Done**.

    7.  Copy the JSON credentials file into this sample's /resources
        folder and rename it to "firebase-credentials.json"

## RUN THE SAMPLE

    1.  In a terminal, navigate to this sample's root directory.

    2.  Run the following commands:

        gcloud config set project PROJECT_ID

        Where PROJECT_ID is the project ID for the project you created when you registered for
        Business Messages.

        gcloud app deploy

    3.  On your mobile device, use the test business URL associated with the
        Business Messages agent you created.
