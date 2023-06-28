
const express = require("express");
const bodyParser = require('body-parser')
const upload = require("express-fileupload");

const knex = require("knex");
const app = express();
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended:true }))
app.use(upload());


//aws_____________________________________________________________________

const AWS = require('aws-sdk')
require('dotenv').config()

//AWS credential 
AWS.config.update({
  secretAccessKey: process.env.ACCESS_SECRET,
  accessKeyId: process.env.ACCESS_KEY,
  region: process.env.REGION,

});
const BUCKET = process.env.BUCKET
const s3 = new AWS.S3();

const baseUrl = `https://${BUCKET}.s3.${AWS.config.region}.amazonaws.com/`;
//company_logo[0], company_email

var uploadFile = async (file, company_email) => {
  console.log("file",file.data)
  return new Promise(function (resolve, reject) {

      const uploadParams = {
          ACL: "public-read",
          Bucket: BUCKET,
          Key: `abc-aws/${company_email}/${file.name}`, // Include userName in the Key
          Body: file.data
      }

      s3.upload(uploadParams, function (err, data) {

          if (err) {
              console.log("file not uploaded")
              return reject({ error: err })
          }

          console.log("file uploaded successfully")
          console.log("IMP == ",data)
          return resolve(data.Location)
      });
  });
}

//____________________________________________________get methode aws _______________________________--
const download = async (company_email) => {
  return new Promise((resolve, reject) => {
    const listParams = {
      Bucket: BUCKET,
      Prefix: `abc-aws/${company_email}/`
    };
    const s3 = new AWS.S3({ apiVersion: '2006-03-01' });
    s3.listObjectsV2(listParams, (err, data) => {

      if (err) {
          console.log("Specified key does not exist:", err);
          return reject({ error: 'Key not found' });
        }

      const url = data.Contents.map((item) => baseUrl+item.Key);
      console.log("Retrieved images", url);
      return resolve(url);
    });
        
    })   
  };

  
//_________________________________________To post a data


//check valid value || not empty value
const isValidInputValue = function (value) {
  // console.log("data", value.organization_email)
  if (typeof value === "undefined" || value === null) return false;
  if (typeof value === "string" && value.trim().length > 0) return true;
  return false;
};
//check valid name
const isValidOnlyCharacters = function (value) {
  return /^[A-Za-z]+$/.test(value);
};
//valid email
const isValidEmail = function (email) {
  const regexForEmail = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
  return regexForEmail.test(email);
};

//____________________________________________post api__________

app.post("/postData",async (req, res) => {
  try {
    const data = req.body;
    console.log("data",data)

    let company_logo = req.files.company_logo;
    console.log("company_logo",company_logo)

  

    let {organization_id,company_name,company_location,company_gst,company_email,company_website,company_financialyear_start,
      company_financialyear_end,compant_TAN_no,company_PAN_no} = data;
    
      if (
        !organization_id ||
        !isValidInputValue(organization_id.trim()) 
      ) {
        return res.status(400).send({
          status: false,
          message: "organization_id is required and should correct only",
        });
      }
              if (
                !company_name ||
                !isValidInputValue(company_name.trim()) ||
                !isValidOnlyCharacters(company_name.trim())
              ) {
                return res.status(400).send({
                  status: false,
                  message: "company_name is required and should contain only alphabets",
                });
              }
              if (
                !company_email ||
                !isValidInputValue(company_email) ||
                !isValidEmail(company_email)
              ) {
                return res.status(400).send({
                  status: false,
                  message: "company_email address is required and should be a valid email address",
                });
              }

              
              if (!company_location || !isValidInputValue(company_location) || !isValidOnlyCharacters(company_location)) {
                return res.status(400).send({
                  status: false,
                  message: "company_location  required and should contain only alphabets",
                });
              }
              //___________________________________________________company_logo________________________________________________
              if (!company_logo || company_logo.length == 0) {
                return res
                    .status(400)
                    .send({ status: false, message: "no company_logo image found" });
            }
            //if (!isValidImageType(company_logo.mimetype)) {return res.status(400).send({ status: false, message: "Only company_logo can be uploaded (jpeg/jpg/png/pdf)" })}

            
              if (
                !company_website ||
                !isValidInputValue(company_website.trim()) || !company_website.match(/^(https?:\/\/)?(www\.)?([a-zA-Z0-9-]+\.){1,}[a-zA-Z0-9-]{2,}$/)
                
              ) {
                return res.status(400).send({
                  status: false,
                  message: "company_website is required and should be correct only ",
                });
              }
      

              if (
                !company_gst ||
                !isValidInputValue(company_gst.trim()) || !company_gst.match(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}[Z]{1}[0-9A-Z]{1}$/)
              ) {
                return res.status(400).send({
                  status: false,
                  message: "company_gst is required and should be correct only",
                });
              }
              if (
                !company_financialyear_start || !/^\d{4}-\d{2}-\d{2}$/.test(company_financialyear_start)) 
              {
                return res.status(400).send({
                  status: false,
                  message: "company_financialyear_start is required and should correct date",
                });
              }
              if (
                !company_financialyear_end || !/^\d{4}-\d{2}-\d{2}$/.test(company_financialyear_end)) 
              {
                return res.status(400).send({
                  status: false,
                  message: "company_financialyear_end is required and should correct date",
                });
              }
              
              
              if (
                !company_PAN_no ||
                !isValidInputValue(company_PAN_no.trim()) ||
                !company_PAN_no.match(/^([A-Z]{5})(\d{4})([A-Z]{1})$/)
              ) {
                return res.status(400).send({
                  status: false,
                  message: "company_PAN_no is required and should correct only ",
                });
              }
              if (
                !compant_TAN_no ||
                !isValidInputValue(compant_TAN_no.trim()) ||
                !compant_TAN_no.match(/^([A-Z]{4})(\d{5})([A-Z]{1})$/)
              ) {
                return res.status(400).send({
                  status: false,
                  message: "compant_TAN_no is required and should correct only ",
                });
              }


              const fileName = `${company_email}`; 

               console.log("company_logo",company_logo)
               console.log("company_email",company_email)
//______________________________________________________________aws upload file,mail

                const uploadedProfilePictureUrl = await uploadFile(company_logo, company_email);
                console.log("uploadedProfilePictureUrl", uploadedProfilePictureUrl)   

      db("ptr_company")
      .insert({
        organization_id:data["organization_id"],
        company_name: data["company_name"],
        company_email: data["company_email"],
        company_location:data["company_location"],
        company_website:data["company_website"],
        company_gst:data["company_gst"],
        company_financialyear_start:data["company_financialyear_start"],
        company_financialyear_end:data["company_financialyear_end"],
        company_PAN_no:data["company_PAN_no"],
        compant_TAN_no:data["compant_TAN_no"],
        company_logo:fileName
        
      })  
      .then((resp) => {
         return res.status(201).json({
            data: {status:true,mesage:"inserted successfully",
            },
          });
        })
         .catch((error) => {
        return res.status(500).send({ error: error.message });
      }); 
    
  
  } catch (error) {return res.status(500).send({ error: error.message });}

})

  //_________________________________________________/ getSingle /________________________________________________________________________________
  app.post('/getSingle', async (req, res) => {
    try {
      const company_email = req.body.company_email;
      console.log("company_email",company_email)

      if (
        !company_email ||
        !isValidInputValue(company_email) ||
        !isValidEmail(company_email)
      ) {
        return res.status(400).send({
          status: false,
          message: "company_email address is required and should be a valid email address",
        });
      }
      const url = await download(company_email);
      if(url.length==0){return res.status(400).send({message:"company_email not found"})}
      else{
        console.log("company_email =>> ",company_email)
        res.status(200).send({status: true,message: "single url",data:url});
      }

    } catch (error) {res.status(500).send({ error: error.message });}
  });




  // app.listen(3000, () => {console.log("mysql Server started at post 3000")});

//------------------ connection knex --------------------
const db = knex({
    client: "mysql",
    connection: {
      host: "localhost",
      user: "root",
      password: "", //password
      database: "attendance_dev",
    },
  });


//_____________validate if some extra fields are present in the request_________________________________________
  const validateExtraFields = (data, fields) => {
    let extraFields = [];
    for (let key in data) {
      if (!fields.includes(key)) {
        extraFields.push(key);
      }
    }
    // console.log(extraFields);
    if (extraFields.length > 0) {
      return false;
    } else {
      return true;
    }
  };


  //Send Response
const response = (code, status, message, data = "", count = false) => {
    let response = {};
    if (code) {
      response.code = code;
    }
    if (status) {
      response.status = status;
    }
    if (message) {
      response.message = message;
    }
    if (data) {
      response.data = data;
    }
    if (count) {
      response.count = count;
    }
    return response;
  };

  //_________________________________________________________update in sql table and create in mongodb documents______________
  app.put('/updateCandidateDetails', async (req, res) => {
    try {
      //validate candidate
      const expectedField = [
        "candidate_id","candidate_name","candidate_gender", "candidate_dob", "candidate_email", "candidate_mobile","candidate_address",
        "candidate_company","candidate_qualification","candidate_applied_dept","candidate_experience", "candidate_ref_no","candidate_resume",
        "candidate_remarks","candidate_interview_date","candidate_interview_time","candidate_updated_by","candidate_is_called","candidate_letter"
      ];
      //if payload field is not match with expected field
      // console.log(helpers.validateExtraFields(req.body, expectedField));
      if (
        !validateExtraFields(req.body, expectedField) ||
        !validateExtraFields(req.params, ["id"])
      ) {
        return res
          .status(404)
          .json(response("404", "error", "Invalid field"));
      }
  
      const payload = req.body;
      //TODO
      payload.candidate_updated_by = "1";
      payload.candidate_updated_at = new Date();
  
      if (req.body.candidate_id) {
        db("ptr_candidates")
          .where("candidate_id", req.body.candidate_id)
          .update(payload)
         
          .then(async (resp) => {
            if (resp) {
            await createUser(payload)
              return res
                .status(200)
                .json(
                  response(
                    "200",
                    "success",
                    "Successfully candidate updated"
                  )
                );

            } else {
              return res
                .status(404)
                .json(response("404", "error", "Candidate not found"));
            }
          })
          .catch((err) => {
            return res
              .status(404)
              .json(
                response(
                  "404",
                  "error",
                  "Problem in Candidate update Query",
                  err
                )
              );
          });
      } else {
        return res
          .status(404)
          .json(response("404", "error", "Candidate id not found"));
      }
    } catch (error) {
      return res
        .status(400)
        .json(response("400", "error", "Something wents wrong"));
    }
  })
//________________________________________________________update in sql table and create in mongodb documents______________


  const createUser = async function (payload) {
    try {
     // let requestBody = req.body;
      const { candidate_id, candidate_name, candidate_gender, candidate_dob, candidate_email, candidate_mobile,candidate_address,
        candidate_company,candidate_qualification,candidate_applied_dept,candidate_experience, candidate_ref_no,candidate_resume,
        candidate_remarks,candidate_interview_date,candidate_interview_time,candidate_updated_by,candidate_is_called,candidate_letter} = payload //Destructuring

        const store={};
        console.log("payload==>",payload)

  
      if (!candidate_id) return res.status(400).send({ status: false, msg: "candidate_id is mandatory" })

      if (candidate_id) { store["candidate_id"]=candidate_id}
      

      if (candidate_name) { store["candidate_name"]=`updated name is : ${candidate_name}`}
      if (candidate_mobile) {store["candidate_mobile"]=`updated candidate_mobile : ${candidate_mobile}`}
      if (candidate_is_called) {store["candidate_is_called"]=`updated candidate_is_called : ${candidate_is_called}`}
      if (candidate_letter) { store["candidate_letter"]=`updated candidate_letter is : ${candidate_letter}`}

      if (candidate_email) {store["candidate_email"]=`updated candidate_email : ${candidate_email}`}
      if (candidate_gender){store["candidate_gender"]=`updated candidate_gender : ${candidate_gender}`}
      if(candidate_address){ store["candidate_address"]=`updated candidate_address : ${candidate_address}`}
        
        if(candidate_dob) {store["candidate_dob"]=`updated candidate_dob : ${candidate_dob}` }
        
        if(candidate_company) {store["candidate_company"]=`updated candidate_company : ${candidate_company}`} 
      
        if(candidate_qualification) {store["candidate_qualification"]=`updated candidate_qualification : ${candidate_qualification}` }

        if(candidate_applied_dept) {store["candidate_applied_dept"]=`updated candidate_applied_dept : ${candidate_applied_dept}`}

        if(candidate_experience) {store["candidate_experience"]=`updated candidate_experience : ${candidate_experience}` }

        if(candidate_ref_no) {store["candidate_ref_no"]=`updated candidate_ref_no : ${candidate_ref_no}` }

        if(candidate_resume) {store["candidate_resume"]=`updated candidate_resume : ${candidate_resume}` }

        if(candidate_remarks) {store["candidate_remarks"]=`updated candidate_remarks : ${candidate_remarks}` }

        if(candidate_interview_date) {store["candidate_interview_date"]=`updated candidate_interview_date : ${candidate_interview_date}`}

        if(candidate_interview_time) {store["candidate_interview_time"]=`updated candidate_interview_time : ${candidate_interview_time}`}

        if(candidate_updated_by) {store["candidate_updated_by"]=`updated candidate_updated_by : ${candidate_updated_by}`}


        console.log("store",store)

      let created = await candidateModel.create(store)
      console.log("Created ==",created)
    }
    catch (err) {
      res.status(500).send({ status: false, msg: err.message })
    }
  }

//__________________________________________________________getDetails mongodb docunents_______________________

//----------------------mongodb connections

const candidateModel = require("./models/candidateModel");
  const mongoose = require('mongoose')

  mongoose.connect("mongodb+srv://RaviKumarSharma:i6tpVmiNCvIQSjH6@cluster0.pnzdn4a.mongodb.net/candidate-logs",{
    useNewUrlParser: true
})
    .then(() => console.log("MongoDb is connected"))
    .catch(err => console.log(err))



 app.get('/getDetails' , async function (req, res) {
    try {
        let requestBody = req.body.candidate_id
        console.log(requestBody)
        
        
        if (!requestBody) {
            
                return res.status(400).send({ status: false, message: "candidate_id is not present" })
            
        }
        let findCandidates = await candidateModel.find({candidate_id:requestBody })
        if (findCandidates.length==0) {
            return res.status(404).send({ status: false, message: "No details found by the given candidate id" })
        }
        res.status(200).send({ status: true, message: "details", data: findCandidates })
    } catch (error) {
        res.status(500).send({ status: false, message: error.message })
    }
})

app.listen(3000, () => {console.log("mysql Server started at post 3000")});


//what is javascript ?