# MERN Ecommerce

## Installation
Remove package-lock.json

Run the following to install everything. (You may need to switch to node version 14 in order to get the app running.)
```bash
npm install
```


## Test Set Up
### cypress for frontend testing
Set server/config/keys.js to the correct MONGO variable
In the .env change MONGO_URI to 
```
mongodb+srv://oose2022:oosefall2022@cluster0.mohmp8x.mongodb.net/23testing?retryWrites=true&w=majority
```

Run the app first with the following command:
```bash
npm run dev
```

Then run cypress using the following:
```bash
npx cypress open
```

### artillery for load testing
Make sure that in server/config/keys.js you have the correct MONGO DB variable commented
In the .env change MONGO_URI to 
```
mongodb+srv://oose2022:oosefall2022@cluster0.mohmp8x.mongodb.net/load_testing?retryWrites=true&w=majority
```
```bash
./run_artillery.sh
```


### API Testing
Make sure that in server/config/keys.js you have the correct MONGO DB variable commented
Run
```
npm test
```



## Testing Documentation

### UI Testing
- Add to cart
- sign in and sign out
- purchasing and cancel order
- creating brand
- creating product
- creating category

### API Testing
- All APIs covered
- 95% Branch Coverage on APIs (some branches were unreachable due to bugs) on API
- Some utils functions weren't tested due to us not testing such functions overall, such as S3 and seeding.
- Main Faults:
  - No Validators in Backend (Almost every api)
    e.g. if login request’s email is an array, it just processes it (find one that match one of the emails).
  - No Authorization Checking in some APIs

- Other faults…
  - Responses aren’t returned in API causing faults when there are other responses after
  - One place where <= should have been used instead of < 0


- Coverage report can be found in /coverage/ folder after running tests


### Load Testing
- Tested a representative API that handles a get request
- Compared the performance of the service with and withoud fetching data from database
- Focused on the ratio of successful request and 95% response with respect to request per second. 
- Test results:
  - ![](./load_testing/success_rate.png)
  - ![](./load_testing/p95res_time.png)














# Readme from forked repo
## Description

An ecommerce store built with MERN stack, and utilizes third party API's. This ecommerce store enable three main different flows or implementations:

1. Buyers browse the store categories, products and brands
2. Sellers or Merchants manage their own brand component
3. Admins manage and control the entire store components 


* features:
  * Node provides the backend environment for this application
  * Express middleware is used to handle requests, routes
  * Mongoose schemas to model the application data
  * React for displaying UI components
  * Redux to manage application's state
  * Redux Thunk middleware to handle asynchronous redux actions


## Database Seed

* The seed command will create an admin user in the database
* The email and password are passed with the command as arguments
* Like below command, replace brackets with email and password. 
* For more information, see code [here](server/utils/seed.js)

```
npm run seed:db [email-***@****.com] [password-******] // This is just an example.
```

## Demo

This application is deployed on Render Please check it out :smile: [here](https://mern-store.onrender.com).

See admin dashboard [demo](https://mernstore-bucket.s3.us-east-2.amazonaws.com/admin.mp4)

## Install

Some basic Git commands are:

```
$ git clone https://github.com/mohamedsamara/mern-ecommerce.git
$ cd project
$ npm install
```

## Setup

```
 Create .env file that include:

  * MONGO_URI & JWT_SECRET
  * PORT & BASE_SERVER_URL & BASE_API_URL & BASE_CLIENT_URL
  * MAILCHIMP_KEY & MAILCHIMP_LIST_KEY => Mailchimp configuration
  * MAILGUN_KEY & MAILGUN_DOMAIN & MAILGUN_EMAIL_SENDER => Mailgun configuration
  * GOOGLE_CLIENT_ID & GOOGLE_CLIENT_SECRET & GOOGLE_CALLBACK_URL => Google Auth configuration
  * FACEBOOK_CLIENT_ID & FACEBOOK_CLIENT_SECRET & FACEBOOK_CALLBACK_URL => Facebook Auth configuration
  * AWS_ACCESS_KEY_ID & AWS_SECRET_ACCESS_KEY & AWS_REGION & AWS_BUCKET_NAME => AWS configuration
```

## Start development

```
$ npm run dev
```

## Simple build for production

```
$ npm run build
```

## Run build for production

```
$ npm start
```


## Languages & tools

- [Node](https://nodejs.org/en/)

- [Express](https://expressjs.com/)

- [Mongoose](https://mongoosejs.com/)

- [React](https://reactjs.org/)

- [Webpack](https://webpack.js.org/)


### Code Formatter

- Add a `.vscode` directory
- Create a file `settings.json` inside `.vscode`
- Install Prettier - Code formatter in VSCode
- Add the following snippet:  

```json

    {
      "editor.formatOnSave": true,
      "prettier.singleQuote": true,
      "prettier.arrowParens": "avoid",
      "prettier.jsxSingleQuote": true,
      "prettier.trailingComma": "none",
      "javascript.preferences.quoteStyle": "single",
    }

```

