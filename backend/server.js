const express = require('express');
const bodyParser = require('body-parser');
var Web3 = require('web3');
var provider = new Web3.providers.HttpProvider("http://127.0.0.1:7545");
var contract = require("@truffle/contract");
const vaccinationRecord = require('../build/contracts/VaccinationRecord.json')
var web3 = new Web3(provider)
const vaccinationRecordContract = contract(vaccinationRecord);
var cors = require('cors')

vaccinationRecordContract.setProvider(web3.currentProvider);
const userContract = require('../build/contracts/UserContract.json')
const UserContract = contract(userContract);
UserContract.setProvider(web3.currentProvider);



const app = express();
app.use(cors())
app.use(bodyParser.urlencoded({ extended: true }))

app.use(bodyParser.json())

app.post('/vaccination/record', async (req, res) => {

  console.log(req.body);

  let results = [];
  let accounts = await web3.eth.getAccounts();
  const deployed = await vaccinationRecordContract.deployed();


  for (let record of req.body.records) {
    const id = record.id;
    const name = record.name;
    const dateOfFirstDose = record.dateOfFirstDose;
    const dateOfSecondDose = record.dateOfSecondDose;
    const typeOfVaccine = record.typeOfVaccine;
    const content = record.content;

    try {
      const cR = await deployed.createRecord(id, name, dateOfFirstDose, dateOfSecondDose, typeOfVaccine, content, { from: accounts[0] });
      results.push({
        id: id,
        success: true,
        data: cR
      });
    } catch (error) {
      results.push({
        id: id,
        success: false,
        message: error.message
      });
    }
  }
  res.json(results);
});

app.get('/vaccination/record/:id', async (req, res) => {
  // res.json({"message": "Vinit"});

  let id = req.params.id;
  let accounts = await web3.eth.getAccounts();
  const deployed = await vaccinationRecordContract.deployed();
  console.log("Id passed from the user: " + id)


  // const cR = await deployed.createRecord(1, "Shubhada", "11/01/2021", "11/03/2021", "Covaxin", "Vinit", {from: accounts[0]})
  const cR = await deployed.getRecord(id, { from: accounts[0] })
  console.log(cR);


  if (cR.logs.length != 0) {
    const resp = {
      id: cR.logs[0].args.id,
      name: cR.logs[0].args.name,
      dateOfFirstDose: cR.logs[0].args.dateOfFirstDose,
      dateOfSecondDose: cR.logs[0].args.dateOfSecondDose,
      typeOfVaccine: cR.logs[0].args.typeOfVaccine,
      content: cR.logs[0].args.content
    }
    res.json(resp);
  } else {
    res.json({ message: "Not Found" })
  }




});

app.post('/user/signup', async (req, res) => {
  const { email, password } = req.body;

  // const userId = generateUniqueId(); 
  const userContract = await UserContract.deployed();

  let accounts = await web3.eth.getAccounts();
  let result;

  try {
    const createUserResult = await userContract.createUser(
      
      email,
      password,
      { from: accounts[0] } 
    );

    result = {
      email: email,
      success: true,
      transactionHash: createUserResult.tx
    };
  } catch (error) {
    result = {
      email: email,
      success: false,
      message: error.message
    };
  }

  res.json(result);
});



// //   struct VaccinationRecord {
//   uint id;
//   string name; 
//   string dateOfFirstDose;
//   string dateOfSecondDose;
//   string typeOfVaccine;
//   string content;
// }

app.listen(3000, () => {
  console.log("Server is listening on port 3000");
});