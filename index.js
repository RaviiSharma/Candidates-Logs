
const express = require("express");
const bodyParser = require('body-parser')
const upload = require("express-fileupload");

const knex = require("knex");
const app = express();
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended:true }))
app.use(upload());
const path = require("path");
const xlsx = require("xlsx");


//Function to serve all static files inside controllers directory.
app.use(express.static('data')); 

// ----------------------------------- validations here -------------------------------

const {validInputValue,validOnlyCharacters,validEmail,validPhone,validNumber,validPincode,validPrice,validObjectId,validImageType,
  ValidPassword,validDigit,validDate,validDateTime,validIFSC,validCharNum} = require('../validations');
  
//------------------ mysql connections knex --------------------
const db = knex({
  client: "mysql",
  connection: {
    host: "localhost",
    user: "root",
    password: "", //password
    database: "attendance_dev",
  },
});

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

// //____________________________________________________get methode aws _______________________________--
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
        !validInputValue(organization_id) 
      ) {
        return res.status(400).send({
          status: false,
          message: "organization_id is required and should correct only",
        });
      }
              if (
                !company_name ||
                !validInputValue(company_name) ||
                !validOnlyCharacters(company_name)
              ) {
                return res.status(400).send({
                  status: false,
                  message: "company_name is required and should contain only alphabets",
                });
              }
              if (
                !company_email ||
                !validInputValue(company_email) ||
                !validEmail(company_email)
              ) {
                return res.status(400).send({
                  status: false,
                  message: "company_email address is required and should be a valid email address",
                });
              }

              
              if (!company_location || !validInputValue(company_location) || !validOnlyCharacters(company_location)) {
                return res.status(400).send({
                  status: false,
                  message: "company_location  required and should contain only alphabets",
                });
              }
              //___________________________________________________company_logo
              if (!company_logo || company_logo.length == 0) {
                return res
                    .status(400)
                    .send({ status: false, message: "no company_logo image found" });
            }
            //if (!validImageType(company_logo.mimetype)) {return res.status(400).send({ status: false, message: "Only company_logo can be uploaded (jpeg/jpg/png/pdf)" })}

            
              if (
                !company_website ||
                !validInputValue(company_website) || !company_website.match(/^(https?:\/\/)?(www\.)?([a-zA-Z0-9-]+\.){1,}[a-zA-Z0-9-]{2,}$/)
                
              ) {
                return res.status(400).send({
                  status: false,
                  message: "company_website is required and should be correct only ",
                });
              }
      

              if (
                !company_gst ||
                !validInputValue(company_gst) || !company_gst.match(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}[Z]{1}[0-9A-Z]{1}$/)
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
                !validInputValue(company_PAN_no) ||
                !company_PAN_no.match(/^([A-Z]{5})(\d{4})([A-Z]{1})$/)
              ) {
                return res.status(400).send({
                  status: false,
                  message: "company_PAN_no is required and should correct only ",
                });
              }
              if (
                !compant_TAN_no ||
                !validInputValue(compant_TAN_no) ||
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
//_____________aws upload file,mail

                const uploadedProfilePictureUrl = await uploadFile(company_logo, company_email);
                console.log("uploadedProfilePictureUrl", uploadedProfilePictureUrl); 

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

//_______________________________________update company________________________________________

app.put('/updateCompany/:company_id',  async (req, res) => {
  const payload = req.body;
  console.log("payload",payload)

  let company_logo = req.files;
  //console.log("company_logo",company_logo)

  let id = req.params.company_id;
  if (!id) {
    return res.status(400).json({ message: "company_id is required" });
  }

  let {organization_id,company_name,company_location,company_gst,company_email,company_website,company_financialyear_start,
    company_financialyear_end,compant_TAN_no,company_PAN_no} = payload;

    if(company_email){
      if (!validInputValue(company_email) ||!validEmail(company_email)) {
        return res.status(400).send({
          status: false,
          message: "company_email address is required and should be a valid email address and you have to also update company_log",});
      }
    
      if(company_logo){
        //console.log("company_logo",req.files.company_logo)
        
        // let k=await db("ptr_company").select("company_email").where("company_id",id)
        // console.log("k",k[0].company_email)
        let c=payload["company_logo"]=company_email
        //console.log("c ",c)
        const uploadedProfilePictureUrl = await uploadFile(req.files.company_logo,company_email);
        console.log("uploadedProfilePictureUrl", uploadedProfilePictureUrl)   
      
      }else{ return res.status(400).send({
        status: false,
        message: "company_logo is required to update",});}
    }else{
      
    }

  if(company_logo){
  //console.log("company_logo",req.files.company_logo)
  
  let k=await db("ptr_company").select("company_email").where("company_id",id)
  console.log("k",k[0].company_email)
  let c=payload["company_logo"]=k[0].company_email
  //console.log("c ",c)
  const uploadedProfilePictureUrl = await uploadFile(req.files.company_logo, k[0].company_email);
  console.log("uploadedProfilePictureUrl", uploadedProfilePictureUrl)   

}

  payload.updated_by = "1";
  payload.updated_at = new Date();
  try {
    const company = await db("ptr_company")
      .where("company_id", id)
      .update(payload);
    return res
      .status(200)
     .send({msg: "Successfully updated Company"});
  } catch (err) {
    
      return res.status(500).send({ error: err });
  }
});
  //_________________________________________________/ getSingle url by company email /________________________________________________________________________________

  app.post('/getSingle', async (req, res) => {
    try {
      const company_email = req.body.company_email;
      console.log("company_email",company_email)

      if (
        !company_email ||
        !validInputValue(company_email) ||
        !validEmail(company_email)
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

//_______________________________________________get company with company logo url_________________________________

  app.post('/getCompany', async (req, res) => {
    try {
      const company_id = req.body.company_id;
      console.log("company_id",company_id)

      if (
        !company_id ||
        !validInputValue(company_id) 
      ) {
        return res.status(400).send({
          status: false,
          message: "company_id  is required and should be a valid company_id ",
        });
      }
      const w = await db('ptr_company').where('company_id', company_id).select('*');
      if(w.length==0){return res.status(400).send({ msg: "company_id is not found in db"});}
      else{
        console.log("w ",w[0].company_email)

        const url = await download(w[0].company_email);
        if(url.length==0){
  
          let object={
            company_id: w[0].company_id,
            organization_id: w[0].organization_id,
            company_name: w[0].company_name,
            company_location: w[0].company_location,
            company_gst: w[0].company_gst,
            company_website: w[0].company_website,
            company_email: w[0].company_email,
            company_logo:w[0].company_logo,
            company_PF_no: w[0].company_PF_no,
            compant_TAN_no: w[0].compant_TAN_no,
            company_PAN_no: w[0].company_PAN_no,
            company_ESI_no: w[0].company_ESI_no,
            company_LIN_no: w[0].company_LIN_no,
            Registration_Certificate_no: w[0].Registration_Certificate_no,
            company_financialyear_start: w[0].company_financialyear_start,
            company_financialyear_end: w[0].company_financialyear_end,
            created_by: w[0].created_by,
            updated_by: w[0].updated_by,
            created_at: w[0].created_at,
            updated_at: w[0].updated_at
        
          }
  
          return res.status(200).send({msg:"details",data:object})}
  
        else{
        
          let object={
            company_id: w[0].company_id,
            organization_id: w[0].organization_id,
            company_name: w[0].company_name,
            company_location: w[0].company_location,
            company_gst: w[0].company_gst,
            company_website: w[0].company_website,
            company_email: w[0].company_email,
      
            company_logo:url,
      
            company_PF_no: w[0].company_PF_no,
            compant_TAN_no: w[0].compant_TAN_no,
            company_PAN_no: w[0].company_PAN_no,
            company_ESI_no: w[0].company_ESI_no,
            company_LIN_no: w[0].company_LIN_no,
            Registration_Certificate_no: w[0].Registration_Certificate_no,
            company_financialyear_start: w[0].company_financialyear_start,
            company_financialyear_end: w[0].company_financialyear_end,
            created_by: w[0].created_by,
            updated_by: w[0].updated_by,
            created_at: w[0].created_at,
            updated_at: w[0].updated_at
        
          }
          console.log("object ",object)
      return res.status(200).send({msg:"details",data:object})
        }
      }
    } catch (error) {res.status(500).send({ error: error.message });}
  });

//_____________________________________get all company Details at time with companies logo____________________________________________________

app.post('/getall', async (req, res) => {
  try {
    const organization_id = req.body.organization_id;
    console.log("organization_id", organization_id);

    if (!organization_id || !validInputValue(organization_id)) {
      return res.status(400).send({
        status: false,
        message: "organization_id is required and should be a valid organization_id",
      });
    }

    const companies = await db('ptr_company')
      .where('organization_id', organization_id)
      .select('*');
      if(companies.length ==0){return res.status(400).send({ msg: "organization_id is not found in db"});}
      else{
        console.log("companies",companies)

        const companyData = companies.map(async (company) => {
          const url = await download(company.company_email);
          console.log("url",url)
    
          if (url.length > 0) {
            company.company_logo = url;
          }
          console.log("company",company)
          return company;
        });
    
        const resolvedCompanies = await Promise.all(companyData);
        //console("resolvedCompanies",resolvedCompanies)
    
        return res.status(200).send({ msg: "details",total:resolvedCompanies.length, companies: resolvedCompanies });
      }

     
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});



  // app.listen(3000, () => {console.log("mysql Server started at post 3000")});



//_____________valid if some extra fields are present in the request_________________________________________
  const validExtraFields = (data, fields) => {
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
      //valid candidate
      const expectedField = [
        "candidate_id","candidate_name","candidate_gender", "candidate_dob", "candidate_email", "candidate_mobile","candidate_address",
        "candidate_company","candidate_qualification","candidate_applied_dept","candidate_experience", "candidate_ref_no","candidate_resume",
        "candidate_remarks","candidate_interview_date","candidate_interview_time","candidate_updated_by","candidate_is_called","candidate_letter"
      ];
      //if payload field is not match with expected field
      // console.log(helpers.validExtraFields(req.body, expectedField));
      if (
        !validExtraFields(req.body, expectedField) ||
        !validExtraFields(req.params, ["id"])
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

  app.post('/createUser' ,async function (req,res) {
    try {
     let payload = req.body;
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
      return res.status(200).send({ code: "200", status: "success", msg: "successfully!", result:store});         

      
    }
    catch (err) {
      res.status(500).send({ status: false, msg: err.message })
    }
  })
  //________________________________________________________updateCandidate _____________________________________________________________

  app.post("/updateCandidate", async function (req, res) {
    try {
      var payload = req.body;
      //console.log(payload)
      var candidate_resume = req.files;

      var {
        candidate_name,
        candidate_gender,
        candidate_dob,
        candidate_email,
        candidate_mobile,
        candidate_address,
        candidate_company,
        candidate_qualification,
        candidate_applied_dept,
        candidate_experience,
        candidate_ref_no,
        candidate_remarks,
        candidate_interview_date,
        candidate_interview_time,
        candidate_updated_by,
        candidate_is_called,
        candidate_letter,
      } = payload; //Destructuring

      var store = {};

      const candidate_id = payload.candidate_id;
      if (!candidate_id) {
        return res
          .status(400)
          .send({ status: false, msg: "candidate_id is mandatory" });
      }
      //esko check krnah resume ko
      if (candidate_resume) {
        console.log("resume is here", candidate_resume);

        var k = await db("ptr_candidates")
          .select("candidate_ref_no")
          .where("candidate_id", candidate_id);
        console.log("k", k[0].candidate_ref_no);

        const uploadedUrl = await uploadFile(
          req.files.candidate_resume,
          k[0].candidate_ref_no
        );

        payload["candidate_resume"] = k[0].candidate_ref_no;

        // console.log("payload",payload)

        const sqlRow = await db("ptr_candidates")
          .where("candidate_id", candidate_id)
          .select("*");

        if (sqlRow) {
          var candidateToUpdate = {};
          //console.log("sqlRow",sqlRow[0][key])


          const entries = Object.entries(payload);
          if (entries.length > 0) {
            entries.shift();
            var modifiedPay = Object.fromEntries(entries);
          }
          
         //  console.log("modifiedPay",modifiedPay)

          for (const key in modifiedPay) {
            if (
              modifiedPay.hasOwnProperty(key) &&
              String(sqlRow[0][key]) !== String(modifiedPay[key])
            ) {
              candidateToUpdate[key] = modifiedPay[key];
              console.log("candidateToUpdate[key]", candidateToUpdate[key]);

              if (payload["candidate_id"]) {
                store[
                  "candidate_id"
                ] = `candidate_id is : ${payload["candidate_id"]}`;
              }

              // if(payload["candidate_resume"]){store["candidate_resume"]=`updated candidate_resume is : ${payload["candidate_resume"]}`;}

              if (candidateToUpdate["candidate_resume"]) {
                store[
                  "candidate_resume"
                ] = `updated candidate_resume is : ${candidateToUpdate["candidate_resume"]}`;
              }

              if (candidateToUpdate["candidate_name"]) {
                store[
                  "candidate_name"
                ] = `updated candidate_name is : ${candidateToUpdate["candidate_name"]}`;
              }

              if (candidateToUpdate["candidate_mobile"]) {
                store[
                  "candidate_mobile"
                ] = `updated candidate_mobile is : ${candidateToUpdate["candidate_mobile"]}`;
              }

              if (candidateToUpdate["candidate_is_called"]) {
                store[
                  "candidate_is_called"
                ] = `updated candidate_is_called is : ${candidateToUpdate["candidate_is_called"]}`;
              }

              if (candidateToUpdate["candidate_letter"]) {
                store[
                  "candidate_letter"
                ] = `updated candidate_letter is : ${candidateToUpdate["candidate_letter"]}`;
              }

              if (candidateToUpdate["candidate_email"]) {
                store[
                  "candidate_email"
                ] = `updated candidate_email is : ${candidateToUpdate["candidate_email"]}`;
              }

              if (candidateToUpdate["candidate_gender"]) {
                store[
                  "candidate_gender"
                ] = `updated candidate_gender is : ${candidateToUpdate["candidate_gender"]}`;
              }

              if (candidateToUpdate["candidate_address"]) {
                store[
                  "candidate_address"
                ] = `updated candidate_address is : ${candidateToUpdate["candidate_address"]}`;
              }

              if (candidateToUpdate["candidate_dob"]) {
                store[
                  "candidate_dob"
                ] = `updated candidate_dob is : ${candidateToUpdate["candidate_dob"]}`;
              }

              if (candidateToUpdate["candidate_company"]) {
                store[
                  "candidate_company"
                ] = `updated candidate_company is : ${candidateToUpdate["candidate_company"]}`;
              }

              if (candidateToUpdate["candidate_qualification"]) {
                store[
                  "candidate_qualification"
                ] = `updated candidate_qualification is : ${candidateToUpdate["candidate_qualification"]}`;
              }

              if (candidateToUpdate["candidate_applied_dept"]) {
                store[
                  "candidate_applied_dept"
                ] = `updated candidate_applied_dept is : ${candidateToUpdate["candidate_applied_dept"]}`;
              }

              if (candidateToUpdate["candidate_experience"]) {
                store[
                  "candidate_experience"
                ] = `updated candidate_experience is : ${candidateToUpdate["candidate_experience"]}`;
              }

              if (candidateToUpdate["candidate_ref_no"]) {
                store[
                  "candidate_ref_no"
                ] = `updated candidate_ref_no is : ${candidateToUpdate["candidate_ref_no"]}`;
              }

              if (candidateToUpdate["candidate_remarks"]) {
                store[
                  "candidate_remarks"
                ] = `updated candidate_remarks is : ${candidateToUpdate["candidate_remarks"]}`;
              }

              if (candidateToUpdate["candidate_interview_date"]) {
                store[
                  "candidate_interview_date"
                ] = `updated candidate_interview_date is : ${candidateToUpdate["candidate_interview_date"]}`;
              }

              if (candidateToUpdate["candidate_interview_time"]) {
                store[
                  "candidate_interview_time"
                ] = `updated candidate_interview_time is : ${candidateToUpdate["candidate_interview_time"]}`;
              }

              if (candidateToUpdate["candidate_updated_by"]) {
                store[
                  "candidate_updated_by"
                ] = `updated candidate_updated_by is : ${candidateToUpdate["candidate_updated_by"]}`;
              }
            } 
          }
          if (Object.keys(candidateToUpdate).length > 0) {
            //update in sql table
            await db("ptr_candidates")
              .where("candidate_id", candidate_id)
              .update(candidateToUpdate);

            const entries = Object.entries(store);
            if (entries.length > 0) {
              entries.shift();
              var modifiedStore = Object.fromEntries(entries);
            }
            console.log("store", store);

            let created = await candidateModel.create(store);
            return res
              .status(200)
              .send({
                code: "200",
                status: "success",
                msg: "successfully!",
                result: modifiedStore,
              });
          }{
            return res.status(400).send({code:"400", status:"success",msg: "nothing to updated" });
          }
        } else {
          console.log("Candidate not found in SQL table");
        }
      }  //when resume is not present
      else {
        console.log("resume not here");

        const sqlRow = await db("ptr_candidates")
          .where("candidate_id", candidate_id)
          .select("*");
        console.log("sqlRow", sqlRow);
        //console.log("payload", payload);

        if (sqlRow) {
          var candidateToUpdate = {};
          //console.log("sqlRow",sqlRow[0][key])
        
         const entries = Object.entries(payload);
         if (entries.length > 0) {
           entries.shift();
           var modifiedPay = Object.fromEntries(entries);
         }
         
        //  console.log("modifiedPay",modifiedPay)

          for (const key in modifiedPay) {

            if (
              modifiedPay.hasOwnProperty(key) &&
              String(sqlRow[0][key]) !== String(modifiedPay[key])
            ) {
              candidateToUpdate[key] = modifiedPay[key];
              console.log("candidateToUpdate[key]", candidateToUpdate[key]);

              if (payload["candidate_id"]) {
                store[
                  "candidate_id"
                ] = `candidate_id is : ${payload["candidate_id"]}`;
              }

              if (candidateToUpdate["candidate_name"]) {
                store[
                  "candidate_name"
                ] = `updated candidate_name is : ${candidateToUpdate["candidate_name"]}`;
              }

              if (candidateToUpdate["candidate_mobile"]) {
                store[
                  "candidate_mobile"
                ] = `updated candidate_mobile is : ${candidateToUpdate["candidate_mobile"]}`;
              }

              if (candidateToUpdate["candidate_is_called"]) {
                store[
                  "candidate_is_called"
                ] = `updated candidate_is_called is : ${candidateToUpdate["candidate_is_called"]}`;
              }

              if (candidateToUpdate["candidate_letter"]) {
                store[
                  "candidate_letter"
                ] = `updated candidate_letter is : ${candidateToUpdate["candidate_letter"]}`;
              }

              if (candidateToUpdate["candidate_email"]) {
                store[
                  "candidate_email"
                ] = `updated candidate_email is : ${candidateToUpdate["candidate_email"]}`;
              }

              if (candidateToUpdate["candidate_gender"]) {
                store[
                  "candidate_gender"
                ] = `updated candidate_gender is : ${candidateToUpdate["candidate_gender"]}`;
              }

              if (candidateToUpdate["candidate_address"]) {
                store[
                  "candidate_address"
                ] = `updated candidate_address is : ${candidateToUpdate["candidate_address"]}`;
              }

              if (candidateToUpdate["candidate_dob"]) {
                store[
                  "candidate_dob"
                ] = `updated candidate_dob is : ${candidateToUpdate["candidate_dob"]}`;
              }

              if (candidateToUpdate["candidate_company"]) {
                store[
                  "candidate_company"
                ] = `updated candidate_company is : ${candidateToUpdate["candidate_company"]}`;
              }

              if (candidateToUpdate["candidate_qualification"]) {
                store[
                  "candidate_qualification"
                ] = `updated candidate_qualification is : ${candidateToUpdate["candidate_qualification"]}`;
              }

              if (candidateToUpdate["candidate_applied_dept"]) {
                store[
                  "candidate_applied_dept"
                ] = `updated candidate_applied_dept is : ${candidateToUpdate["candidate_applied_dept"]}`;
              }

              if (candidateToUpdate["candidate_experience"]) {
                store[
                  "candidate_experience"
                ] = `updated candidate_experience is : ${candidateToUpdate["candidate_experience"]}`;
              }

              if (candidateToUpdate["candidate_ref_no"]) {
                store[
                  "candidate_ref_no"
                ] = `updated candidate_ref_no is : ${candidateToUpdate["candidate_ref_no"]}`;
              }

              if (candidateToUpdate["candidate_remarks"]) {
                store[
                  "candidate_remarks"
                ] = `updated candidate_remarks is : ${candidateToUpdate["candidate_remarks"]}`;
              }

              if (candidateToUpdate["candidate_interview_date"]) {
                store[
                  "candidate_interview_date"
                ] = `updated candidate_interview_date is : ${candidateToUpdate["candidate_interview_date"]}`;
              }

              if (candidateToUpdate["candidate_interview_time"]) {
                store[
                  "candidate_interview_time"
                ] = `updated candidate_interview_time is : ${candidateToUpdate["candidate_interview_time"]}`;
              }

              if (candidateToUpdate["candidate_updated_by"]) {
                store[
                  "candidate_updated_by"
                ] = `updated candidate_updated_by is : ${candidateToUpdate["candidate_updated_by"]}`;
              }
            } 
          }

          console.log("candidateToUpdate",Object.keys(candidateToUpdate).length)

          if (Object.keys(candidateToUpdate).length > 0) {
            //update in sql table
            await db("ptr_candidates")
              .where("candidate_id", candidate_id)
              .update(candidateToUpdate);

            const entries = Object.entries(store);
            if (entries.length > 0) {
              entries.shift();
              var modifiedStore = Object.fromEntries(entries);
            }
            console.log("store", store);

            let created = await candidateModel.create(store);
            return res
              .status(200)
              .send({
                code: "200",
                status: "success",
                msg: "successfully!",
                result: modifiedStore,
              });
          } else {
            return res.status(400).send({code:"400", status:"success",msg: "nothing to updated" });
          }
        } else {
          console.log("Candidate not found in SQL table");
        }
      }
    } catch (err) {
      return res
        .status(500)
        .send({ code: "500", status: "failed", error: "server error" });
    }
  });
  
//______________________________________________________________candidateLogs ______________________________________________

  app.get("/candidateLogs", async function (req, res) {
    try {
      const candidate_id = req.body.candidate_id;
      console.log("candidate_id", candidate_id);

      if (validInputValue(candidate_id)) {
        const result = await candidateModel.find({
          candidate_id: `candidate_id is : ${candidate_id}`,
        });

        if (result.length > 0) {
          console.log(result);
          return res.send({
            code: "200",
            status: "success",
            no_candidateLogs: result.length,
            response: "candidateLogs",
            data: result,
          });
        } else {
          return res
            .status(400)
            .send({
              code: "400",
              status: "failed",
              error: `no data present by canidate_id : ${candidate_id} `,
            });
        }
      } else {
        return res
          .status(400)
          .send({
            code: "400",
            status: "failed",
            error: "candidate_id is required",
          });
      }
    } catch (err) {
      return res
        .status(500)
        .send({ code: "500", status: "failed", error: "server error" });
    }
  });

//__________________________________________________________getDetails mongodb docunents_______________________

//----------------------mongodb connections

// const candidateModel = require("./models/candidateModel");
//   const mongoose = require('mongoose')

//   mongoose.connect("mongodb+srv://RaviKumarSharma:i6tpVmiNCvIQSjH6@cluster0.pnzdn4a.mongodb.net/candidate-logs",{
//     useNewUrlParser: true
// })
//     .then(() => console.log("MongoDb is connected"))
//     .catch(err => console.log(err))



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

//________________________________- editemployee -____________________________________

let uploadFile2 = async (file, employee_no) => {
  return new Promise(function (resolve,reject) {
    const uploadParams = {
      ACL: "public-read",
      Bucket: BUCKET,
      Key: `abc-aws/${employee_no}/${file.name}`,
      Body: file.data,
    };
    s3.upload(uploadParams, function (err, data) {
      if (err) {
        console.log("file not uploaded", err);
       return reject("file not uploaded" + err.message);
      }
      console.log("file uploaded successfully");
      console.log("IMP== ", data);
      return resolve(data.Location);
    });
  });
};

///

app.put('/editemployee/:employee_id', async (req, res) => {
  try {
    const data = req.body;
    const employeePhoto = req.files && req.files.employee_photo;

    const store = {};

    // valid employee_id
    if (!validInputValue(req.params.employee_id)) {
      return res.status(400).send({ status: false, message: "employee_id is required and should contain only alphabets" });
    }
    store["employee_id"] = req.params.employee_id;

    // valid other fields
    if (data.employee_name) {
      if(!validInputValue(data.employee_name) || !validOnlyCharacters(data.employee_name));
      store["employee_name"] = data.employee_name;
    }

    if(data.employee_fathers_name) {
      if(!validInputValue(data.employee_fathers_name) || !validOnlyCharacters(data.employee_fathers_name));
      store["employee_fathers_name"]=data.employee_fathers_name;
    }
    
    if (data.employee_password) {
      if(!validInputValue(data.employee_password) || !ValidPassword(data.employee_password));
      store["employee_password"]=data.employee_password;
    }

    if (data.employee_gender) {
      if (!validInputValue(data.employee_gender) || !validDigit(data.employee_gender) || !['1', '2'].includes(data.employee_gender)){
        return  res.status(400).send({ code:"400",status: false, message: "employee_gender is required and should contain only 1 or 2" });};
      store["employee_gender"] = data.employee_gender;  
    }

    if (data.employee_dob) {
      if (!validInputValue(data.employee_dob) || !validDate(data.employee_dob));
      store["employee_dob"] = data.employee_dob;
    }

    if (data.employee_email) {
      if (!validInputValue(data.employee_email) ||!validEmail(data.employee_email));   
      store["employee_email"]=data.employee_email;
      }

      // valid employee_photo
    if (employeePhoto) {
      const k = await db("ptr_employees").select("employee_no").where("employee_id", req.params.employee_id);
      if (k.length === 0) {
        return res.status(400).send({ status: false, message: "data not found" });
      }
      const uploadedUrl = await uploadFile2(employeePhoto, k[0].employee_no);
      store["employee_photo"] = k[0].employee_no;
    }

      if (data.employee_mobile) {
      if (!validInputValue(data.employee_mobile) ||!validPhone(data.employee_mobile));    
      store["employee_mobile"]=data.employee_mobile;
      }  

      if (data.employee_company) {
        if(!validInputValue(data.employee_company) || !validOnlyCharacters(data.employee_company));
        store["employee_company"] = data.employee_company;
      }

      if (data.employee_designation) {
        if(!validInputValue(data.employee_designation) || !validDigit(data.employee_designation));
        store["employee_designation"] = data.employee_designation;
      }

      if (data.employee_branch_type) {
        if (!validInputValue(data.employee_branch_type) || !validDigit(data.employee_branch_type) || ![1, 2, 3].includes(parseInt(data.employee_branch_type))) {
          return res.status(400).send({ status: false, message: "employee_branch_type contain only valid values of 1, 2, or 3" })}
        store["employee_branch_type"] = data.employee_branch_type;
      }
      
      if (data.employee_probation_start) {
        if (!validInputValue(data.employee_probation_start) ||!validDateTime(data.employee_probation_start));    
       store["employee_probation_start"]=data.employee_probation_start;
      }

      if (data.employee_probation_end) {
        if (!validInputValue(data.employee_probation_end) ||!validDateTime(data.employee_probation_end));    
       store["employee_probation_end"]=data.employee_probation_end;
      }

      if (data.employee_home_address) {
        if (!validInputValue(data.employee_home_address) ||!validOnlyCharacters(data.employee_home_address));    
        store["employee_home_address"]=data.employee_home_address;
      }

      if (data.employee_office_address) {
        if (!validInputValue(data.employee_office_address) ||!validOnlyCharacters(data.employee_office_address));     
        store["employee_office_address"]=data.employee_office_address;
      }

      if (data.employee_present_address) {
        if (!validInputValue(data.employee_present_address) ||!validOnlyCharacters(data.employee_present_address));     
        store["employee_present_address"]=data.employee_present_address;
      }

      if (data.employee_type) {
        if (!validInputValue(data.employee_type) || !validDigit(data.employee_type) || ![1, 2, 3, 4, 5].includes(parseInt(data.employee_type))) {
          return res.status(400).send({ status: false, message: "employee_type is required and should contain only valid values of 1, 2, 3, 4, or 5" })};
        store["employee_type"] = data.employee_type;
      }

      if (data.employee_blood_group) {
        if (!validInputValue(data.employee_blood_group) ||!validOnlyCharacters(data.employee_blood_group));    
        store["employee_blood_group"] = data.employee_blood_group;
          }

          if (data.employee_marital_status) {
            if (!validInputValue(data.employee_marital_status) || !validDigit(data.employee_marital_status) || ![0, 1, 2].includes(parseInt(data.employee_marital_status))) {
              return res.status(400).send({ status: false, message: "employee_marital_status is required and should contain only valid values of 0, 1, or 2" });};
            store["employee_marital_status"] = data.employee_marital_status;
          }

          if (data.employee_religion) {
            if (!validInputValue(data.employee_religion) ||!validOnlyCharacters(data.employee_religion));              
                store["employee_religion"] = data.employee_religion;
              }

              if (data.employee_grade) {
                if (!validInputValue(data.employee_grade) ||!validOnlyCharacters(data.employee_grade));            
                    store["employee_grade"] = data.employee_grade;
                  }
              
                  if (data.employee_bank_ac_number) {
                    if (!validInputValue(data.employee_bank_ac_number) || !validOnlyCharacters(data.employee_bank_ac_number));                  
                    store["employee_bank_ac_number"] = data.employee_bank_ac_number;
                  }

                  if (data.employee_ifsc) {
                    if (!validInputValue(data.employee_ifsc) ||!validIFSC(data.employee_ifsc));                  
                    store["employee_ifsc"] = data.employee_ifsc;
                  }
                  
                  if (data.employee_name_in_bank_ac) {
                    if (!validInputValue(data.employee_name_in_bank_ac) ||!validOnlyCharacters(data.employee_name_in_bank_ac));                  
                    store["employee_name_in_bank_ac"] = data.employee_name_in_bank_ac;
                  }

                  if (data.employee_verification_status) {
                    if (!validInputValue(data.employee_verification_status) || !validDigit(data.employee_verification_status) || ![0,1,2,3].includes(parseInt(data.employee_verification_status))){
                      return res.status(400).send({ status: false, message: "employee_verification_status is required and should contain only valid numbers (0, 1, 2, or 3)" });};
                    store["employee_verification_status"] = data.employee_verification_status;
                  }
                  
            
                  if (data.employee_verification_completed_on) {
                    if (!validInputValue(data.employee_verification_completed_on) ||!validDateTime(data.employee_verification_completed_on));                  
                    store["employee_verification_completed_on"] = data.employee_verification_completed_on;
                  }

                  if (data.employee_verification_agency) {
                    if (!validInputValue(data.employee_verification_agency) ||!validOnlyCharacters(data.employee_verification_agency));                   
                     store["employee_verification_agency"] = data.employee_verification_agency;
                   }
               
                   if (data.employee_no) {
                     if (!validInputValue(data.employee_no) || !validCharNum(data.employee_no));
                     store["employee_no"] = data.employee_no;
                   }

                   if (data.org_id) {
                    if (!validInputValue(data.org_id) ||!validDigit(data.org_id));
                    store["org_id"] = data.org_id;
                    }
        

    console.log("new ",store)

   // Check if the employee exists and update
    const results = await db.select("*").from("ptr_employees").where("employee_id", req.params.employee_id);
    if (results.length !== 1) {
      return res.status(404).json({ code: "404", status: "error", message: "Invalid emp" });
    } else {
      await db("ptr_employees").where("employee_id", req.params.employee_id).update(store);
      return res.status(200).json({ code: "200", status: "success", message: "Successfully emp Update", data: store });
    }
  } catch (error) {
    return res.status(500).json({ code: "500", status: "error", message: "Something went wrong: " + error, data: {} });
  }
});


//--------------------------------------------------------------- getEmployee with url ---------------------------------------

app.post('/getEmployee', async (req, res) => {
  try {
    const employee_id = req.body.employee_id;
    console.log("employee_id",employee_id)

    if (
      !employee_id ||
      !validInputValue(employee_id) 
    ) {
      return res.status(400).send({
        status: false,
        message: "employee_id  is required and should be a valid employee_id ",
      });
    }
    const w = await db('ptr_employees').where('employee_id', employee_id).select('*');
    if(w.length==0){return res.status(400).send({ msg: "employee_id is not found in db"});}
    else{
      console.log("w ",w[0].employee_no)

      const url = await download(w[0].employee_no);
      if(url.length==0){

        let object={

          employee_id: w[0].employee_id,
          employee_no: w[0].employee_no,
          employee_ip_address: w[0].employee_ip_address,
          employee_company: w[0].employee_company,
          
          employee_fathers_name: w[0].employee_fathers_name,
          employee_dob: w[0].employee_dob,
          employee_otp: w[0].employee_otp,

          employee_token:w[0].employee_token,
          employee_salt: w[0].employee_salt,
          employee_password: w[0].employee_password,
          employee_email: w[0].employee_email,

          employee_email: w[0].employee_email,
          employee_mobile: w[0].employee_mobile,
          employee_gender: w[0].employee_gender,

          employee_designation: w[0].employee_designation,
          employee_grade: w[0].employee_grade,
          employee_pancard: w[0].employee_pancard,

          employee_home_address: w[0].employee_home_address,
          employee_office_address: w[0].employee_office_address,
          employee_present_address: w[0].employee_present_address,
          
          employee_kyc:w[0].employee_kyc,
          employee_type:w[0].employee_type,
          employee_company:w[0].employee_company,
          employee_branch_type:w[0].employee_branch_type,

          employee_probation_start:w[0].employee_probation_start,
          employee_probation_end:w[0].employee_probation_end,
          employee_notice_period:w[0].employee_notice_period,
          employee_active:w[0].employee_active,

          employee_blood_group:w[0].employee_blood_group,
          employee_marital_status:w[0].employee_marital_status,
          employee_religion:w[0].employee_religion,
          employee_bank_ac_number:w[0].employee_bank_ac_number,
          employee_ifsc:w[0].employee_ifsc,

          employee_company_in_bank_ac:w[0].employee_company_in_bank_ac,
          employee_verification_status:w[0].employee_verification_status,
          employee_verification_completed_on:w[0].employee_verification_completed_on,
          employee_verification_agency:w[0].employee_verification_agency,
          employee_isprobation:w[0].employee_isprobation,

          employee_created_date:w[0].employee_created_date,
          employee_created_by:w[0].employee_created_by,
          employee_updated_date:w[0].employee_updated_date,

          employee_wallet:w[0].employee_wallet,
          employee_min_wallet_balance:w[0].employee_min_wallet_balance,

          employee_service_profile:w[0].employee_service_profile,
          employee_package_id:w[0].employee_package_id,
          reporting_person:w[0].reporting_person,
          org_id:w[0].org_id,
      
        }

        return res.status(200).send({msg:"details",data:object})}

      else{
      
        let object={

          employee_id: w[0].employee_id,
          employee_no: w[0].employee_no,
          employee_ip_address: w[0].employee_ip_address,
          employee_company: w[0].employee_company,
          
          employee_fathers_name: w[0].employee_fathers_name,
          employee_dob: w[0].employee_dob,
          employee_otp: w[0].employee_otp,

          employee_token:w[0].employee_token,
          employee_salt: w[0].employee_salt,
          employee_password: w[0].employee_password,
          employee_email: w[0].employee_email,

          employee_email: w[0].employee_email,
          employee_mobile: w[0].employee_mobile,
          employee_gender: w[0].employee_gender,

          employee_designation: w[0].employee_designation,
          employee_grade: w[0].employee_grade,
          employee_pancard: w[0].employee_pancard,

          employee_home_address: w[0].employee_home_address,
          employee_office_address: w[0].employee_office_address,
          employee_present_address: w[0].employee_present_address,
         
          //employee_photo
          employee_photo:url,
          
          employee_kyc:w[0].employee_kyc,
          employee_type:w[0].employee_type,
          employee_company:w[0].employee_company,
          employee_branch_type:w[0].employee_branch_type,

          employee_probation_start:w[0].employee_probation_start,
          employee_probation_end:w[0].employee_probation_end,
          employee_notice_period:w[0].employee_notice_period,
          employee_active:w[0].employee_active,

          employee_blood_group:w[0].employee_blood_group,
          employee_marital_status:w[0].employee_marital_status,
          employee_religion:w[0].employee_religion,
          employee_bank_ac_number:w[0].employee_bank_ac_number,
          employee_ifsc:w[0].employee_ifsc,

          employee_company_in_bank_ac:w[0].employee_company_in_bank_ac,
          employee_verification_status:w[0].employee_verification_status,
          employee_verification_completed_on:w[0].employee_verification_completed_on,
          employee_verification_agency:w[0].employee_verification_agency,
          employee_isprobation:w[0].employee_isprobation,

          employee_created_date:w[0].employee_created_date,
          employee_created_by:w[0].employee_created_by,
          employee_updated_date:w[0].employee_updated_date,

          employee_wallet:w[0].employee_wallet,
          employee_min_wallet_balance:w[0].employee_min_wallet_balance,

          employee_service_profile:w[0].employee_service_profile,
          employee_package_id:w[0].employee_package_id,
          reporting_person:w[0].reporting_person,
          org_id:w[0].org_id,
        }
        console.log("object ",object)
    return res.status(200).send({msg:"details",data:object})
      }
    }
  } catch (error) {res.status(500).send({ error: error.message });}
});


//------------------------------------------------- get all emp with url -----------------------------------------------

app.get('/getallEmployees', async (req, res) => {
  try {
    
    
    const employees = await db('ptr_employees').select('*');
    
    if(employees.length ==0){return res.status(400).send({code:"400", status:"failed",response: "data is not found in db"});}
    else{
      //console.log("companies",companies)
      
      const employeeData = employees.map(async (emp) => {
        const url = await download(emp.employee_no);
        console.log("url",url)
        
        if (url.length > 0) {
          emp.employee_photo = url;
          
        }
        //console.log("company",company)
        return emp;
      });
      
        const resolvedEmployees = await Promise.all(employeeData);
        //console("resolvedCompanies",resolvedCompanies)
    
        return res.status(200).send({ code:"200", status:"success",total:resolvedEmployees.length, employees: resolvedEmployees });
      }

     
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

//------------------------------------------------------------- getBdayWish -----------------------------------------------

const moment = require('moment');

app.get('/getBdayWish', async (req, res) => {
  try {
    const today = moment().format('YY-MM-DD');
    const employees = await db('ptr_employees')
      .select('employee_company')
      .where('employee_dob', today);

    const employeeData = employees.map(emp => ({
      employee_company: `Happy Birthday ${emp.employee_company}`
    }));

    if (employeeData.length === 0) {
      return res.status(400).send({ code: "400", status: "failed", response: "No employee has a birthday today." });
    }

    return res.status(200).send({ code: "200", status: "success", employees: employeeData });
  } catch (error) {
    return res.status(500).send({ error: error.message });
  }
});

//---------------------------------------------------------- getAnniversaryWish ----------------------------------


app.get('/getAnniversaryWish', async (req, res) => {
  try {
    const today = moment().subtract(1, 'year').format('YY-MM-DD');
    const employees = await db('ptr_employees')
      .select('employee_name')
      .whereRaw("DATE(employee_created_date) = DATE(?)", [today]);

    const employeeData = employees.map(emp => ({
      employee_company: `Happy Anniversary ${emp.employee_name}`
    }));

    if (employeeData.length === 0) {
      return res.status(400).send({ code: "400", status: "failed", response: "No employee has an anniversary today." });
    }

    return res.status(200).send({ code: "200", status: "success", employees: employeeData });
  } catch (error) {
    return res.status(500).send({ error: error.message });
  }
});



//____________________________/ send mail to multiple persons /____________________________________________________


const nodemailer = require("nodemailer");
const Mailgen = require("mailgen");
app.use(express.json()); 

app.post('/sendBulkMail/:employee_id' , async(req, res) => {
  try{  employee_id=req.params.employee_id

    if(!employee_id){return res.send({code:400,status:'failed',response:'employee_id is required!'})}

       rightEMP=await db.select('employee_company','employee_email','employee_type').where('employee_id',employee_id).from("ptr_employees");

       if(rightEMP.length ==0){return res.send({code:400,status:'failed',response:`no employee found by this employee_id : ${employee_id}`})}


       console.log('rightEMP',rightEMP)

       if (![2, 5].includes(rightEMP[0].employee_type)) {return res.send({ code: 400, status: 'failed', response: 'unauthorized' });}
      
       console.log('rightEMP',rightEMP[0].employee_email)


       let authEMAIL=rightEMP[0].employee_email;
        let fromBody=req.body.intro;
        ///console.log("fromBody",fromBody)

      let emailData = await db.select("employee_email","employee_company").from("ptr_employees")
      //console.log(emailData);
      let recipients = emailData.map((data) => data.employee_email); // Extract the email addresses
      console.log("recipients", recipients)  


//-----------------------------------------------------------------------
      let store={};
store['announcement']=fromBody
store['announcement_by']=employee_id


//mail connections 
        nodemailer.createTransport({service: "gmail",auth: {user: "engineerravi036@gmail.com",pass: "jqnsxdeoiesptqhk"}})
        .sendMail({from:`${authEMAIL}`,to: recipients.join(','),subject: "announcement",
        html: new Mailgen({theme: "default",product: { name: "Recharge Kit Fintech Pvt Ltd", link: "https://rechargkit.com/"},})
        .generate({body: {intro: fromBody,outro: "Looking forward to get response",}})})
          .then(() => {return res.status(200).json({ msg: "email successfully sended to all",})})
          //.catch((error) => {return res.status(500).json({ error })});

          await db("ptr_announcement").insert(store);
          console.log("store",store)
       
      }catch (error) {return res.status(500).send({error: error.message});}});

 




//------------------------------------  letter api by employee_id [hr,admin] --------------------------------------------------


const fs = require('fs');

app.post('/letterAPI/:employee_id', async (req, res) => {
  try {
    const { employee_id } = req.params;
    const data = req.body;

    const {
      employee_company,
      employee_fathers_name,
      employee_designation,
      employee_branch_type,
      employee_joining_date,
      employee_leaving_date,
      company_name,
      company_logo,
      employee_salary,
      letter_type
    } = data;

    if (!employee_id || !letter_type) {
      return res.status(400).send({
        code: 400,
        status: 'failed',
        response: 'employee_id and letter_type are required!'
      });
    }

    const rightEMP = await db
      .select('employee_company', 'employee_email', 'employee_type')
      .where('employee_id', employee_id)
      .from('ptr_employees');

    if (rightEMP.length === 0 || ![2, 5].includes(rightEMP[0].employee_type)) {
      return res.status(400).send({
        code: 400,
        status: 'failed',
        response: 'Unauthorized'
      });
    }

    const dbLetter_type = await db
      .select('letter_type')
      .where('letter_id', letter_type)
      .from('ptr_letters');

    if (dbLetter_type.length === 0) {
      return res.status(400).send({
        code: 400,
        status: 'failed',
        response: `No letter_type found by this letter_id: ${letter_type}`
      });
    }

    const url = await download(company_logo);
    if (url.length === 0) {
      return res.status(400).send({ message: 'company_logo not found' });
    }

    var html;

    if(dbLetter_type[0].letter_type=='Offer Letter'){
      console.log("dd")
       html = fs.readFileSync('offerLetter.html', 'utf8');
     }else if(dbLetter_type[0].letter_type=='Experience Letter'){

       html = fs.readFileSync('experienceLetter.html', 'utf8');
     }else if(dbLetter_type[0].letter_type=='Internship Letter'){
      html = fs.readFileSync('internshipLetter.html', 'utf8');
     }

    const replacements = {
      '[COMPANY_LOGO]': url[2],
      '[employee_company]': employee_company,
      '[employee_fathers_name]': employee_fathers_name,
      '[employee_designation]': employee_designation,
      '[employee_branch_type]': employee_branch_type,
      '[COMPANY_NAME]': company_name,
      '[START_DATE]': employee_joining_date,
      '[SALARY]': employee_salary,
      '[empType]': 'HR',
      '[rightName]': rightEMP[0].employee_company,
      '[employee_joining_date]': employee_joining_date,
      '[employee_leaving_date]': employee_leaving_date,
      '[CONTACT_INFORMATION]': '1236788888'
    };

    const modifiedHTML = html.replace(/(\[.*?\])/g, (match) => replacements[match] || match);

    return res.status(200).send(modifiedHTML);
  } catch (error) {
    return res.status(500).send({ error: error.message });
  }
});












app.post('/candidate_status_update/:candidate_id', async (req, res) => {
  try {
    console.log("candidate_status_update api");
  
    let store={}
      store["candidate_status"] = req.body.candidate_status;
      store["candidate_status_update"] = new Date();

    
    
    if (!validInputValue(req.params.candidate_id)) {
      return res.status(400).send({ status: false, message: "candidate_id is required and should contain only number" });
    }
    if (req.body.candidate_status!== 1&&
      req.body.candidate_status !== 2 &&
      req.body.candidate_status !== 3 &&
      req.body.candidate_status !== 4 &&
      req.body.candidate_status !== 5 &&
      req.body.candidate_status !== 6 &&
      req.body.candidate_status !== 7 &&
      req.body.candidate_status !== 8){return res.status(400).send({ code: "400", status: "failed",
      message: `incorrect candidate_status ${req.body.candidate_status}`});

    }else{
      const results = await db.select("*").from("ptr_candidates").where("candidate_id", req.params.candidate_id);
      if (results.length !== 1) {
        return res.status(404).json({ code: "400", status: "error", message: `invalid id ${req.params.candidate_id}` });
      } else {
        await db("ptr_candidates").where("candidate_id", req.params.candidate_id).update(store);
        return res.status(200).json({ code: "200", status: "success", message: "Successfully Update", data: store });
      }

    }

  } catch (error) {
    return res.status(500).json({ code: "500", status: "error", message: "Something went wrong: " + error, data: {} });
  }
});


app.get('/candidate_response/:candidate_id', async (req, res) => {
  try {
    console.log("candidate_response api");

    if (!validInputValue(req.params.candidate_id)) {
      return res.status(400).send({ status: false, message: "candidate_id is required and should contain only numbers" });
    }

    const results = await db.select("candidate_is_called").from("ptr_candidates").where("candidate_id", req.params.candidate_id);

    if (results.length !== 1) {
      return res.status(400).json({ code: "400", status: "error", message: `Invalid id ${req.params.candidate_id}` });
    }

    console.log("candidate_is_called", results[0].candidate_is_called);

    if (results[0].candidate_is_called === 2 || results[0].candidate_is_called === 3) {
      const within24 = new Date();                           // for current date and time
      within24.setHours(within24.getHours() - 24);

      console.log("within24", within24);

      const data = await db
        .select("candidate_status_update")
        .from("ptr_candidates")
        .where("candidate_status_update", ">=", within24);

       console.log("data", data);

      if (data.length !== 1) {
        console.log("no data within 24");

        const store = {
          candidate_is_called: 1,
          candidate_status_update: new Date()
        };

        await db("ptr_candidates")
          .where("candidate_id", req.params.candidate_id)
          .update(store);

        return res.status(200).json({
          code: "200",
          status: "success",
          message: "Successfully updated"
        });
      } else {
        return res.status(400).json({
          code: "400",
          status: "failed",
          message: "No changes required"
        });
      }
    } else {
      return res.status(400).json({ code: "400", status: "failed", message: "Candidate might not be connected or not interested" });
    }
  } catch (error) {
    return res.status(500).json({ code: "500", status: "error", message: "Something went wrong: " + error, data: {} });
  }
});



const ExcelJS = require('exceljs');
//getCandidatesReportWithType
app.post("/getCandidatesReportWithType", async (req, res) => {
  try {
    console.log("getCandidatesReportWithType api");
    const candidate = await db("ptr_candidates")
      .select("candidate_id","org_id","candidate_name","candidate_mobile","candidate_email","candidate_ref_no","candidate_gender","candidate_dob","candidate_address","candidate_qualification","candidate_experience")
      .orderBy("candidate_id", "desc");


      
  const mappedData = candidate.map((record) => {
    const attendanceType = record.candidate_gender;
    switch (attendanceType) {
      case 1:
        return { ...record, candidate_gender: 'male' };
      case 2:
        return { ...record, candidate_gender: 'female' };
      default:
        return record;
    }
  });

    if (mappedData.length === 0) {
      return res
        .status(400)
        .send({
          code: "400",
          status: "failed",
          response: "data is not found in db",
        });
    } else {
      let candidateData = mappedData.map(async (cand) => {
        const url = await download(cand.candidate_ref_no);

        if (url.length > 0) {
          cand.candidate_resume = url;
        }

        return cand;
      });

      let resolvedCandidates = await Promise.all(candidateData);
      if (req.body.type === 1) {
        console.log("1");

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet();

        const columnHeaders = Object.keys(resolvedCandidates[0]);
        worksheet.addRow(columnHeaders);

        resolvedCandidates.forEach((resolvedCandidates) => {
          const rowData = Object.values(resolvedCandidates);
          worksheet.addRow(rowData);
        });

        const filename = "data/excel.xlsx";
        workbook.xlsx
          .writeFile(filename)
          .then(() => {
            const baseUrl = `http://192.168.101.15:${process.env.PORT || 3000}`;
            const imageUrl = `${baseUrl}/excel.xlsx`;

            return res
              .status(200)
              .send({
                code: "200",
                status: "success",
                message: `Data successfully exported`,
                url: imageUrl,
              });
          })
          .catch((err) => {
            res.status(500).send({ err: err.message });
          });
      } else if (req.body.type === 2) {
        console.log("2");
        return res
          .status(200)
          .send({
            code: "200",
            status: "success",
            total_candidates: resolvedCandidates.length,
            candidates: resolvedCandidates,
          });
      } else {
        res
          .status(400)
          .send({
            code: "400",
            status: "failed",
            message: "please type 1 or 2 to get data",
          });
      }
    }
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

//getEmployeeReportWithType
app.post("/getEmployeeReportWithType", async (req, res) => {
  try {
    console.log("getEmployeeReportWithType api");
    const employee = await db("ptr_employees")
      .select("employee_id","employee_no","employee_name","employee_fathers_name","employee_dob","employee_email","employee_service_email","employee_mobile","employee_gender",
      "employee_designation","employee_pancard","employee_home_address","employee_office_address","employee_present_address","employee_photo","employee_marital_status")
      .orderBy("employee_id", "desc");


           
  const mappedData = employee.map((record) => {
    const attendanceType = record.employee_gender;
    switch (attendanceType) {
      case 1:
        return { ...record, employee_gender: 'Male' };
      case 2:
        return { ...record, employee_gender: 'Female' };
      default:
        return record;
    }
  });

  const mappedData1 = mappedData.map((record) => {
    const attendanceType = record.employee_marital_status;
    switch (attendanceType) {
      case 0:
        return { ...record, employee_marital_status: 'single' };
      case 1:
        return { ...record, employee_marital_status: 'married' };
      case 2:
        return { ...record, employee_marital_status: 'widowed' };
      default:
        return record;
    }
  });

    if (mappedData1.length === 0) {
      return res
        .status(400)
        .send({
          code: "400",
          status: "failed",
          response: "data is not found in db",
        });
    } else {
      let employeeData = mappedData1.map(async (emp) => {
        const url = await download(emp.employee_no);

        if (url.length > 0) {
          emp.employee_photo = url;
        }

        return emp;
      });

      let resolvedEmployees = await Promise.all(employeeData);

      if (req.body.type === 1) {
        console.log("1");

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet();

        const columnHeaders = Object.keys(resolvedEmployees[0]);
        worksheet.addRow(columnHeaders);

        resolvedEmployees.forEach((resolvedEmployees) => {
          const rowData = Object.values(resolvedEmployees);
          worksheet.addRow(rowData);
        });

        const filename = "data/employeeExcel.xlsx";
        workbook.xlsx
          .writeFile(filename)
          .then(() => {
            const baseUrl = `http://192.168.101.15:${process.env.PORT || 3000}`;
            const imageUrl = `${baseUrl}/employeeExcel.xlsx`;

            return res
              .status(200)
              .send({
                code: "200",
                status: "success",
                message: `Data successfully exported`,
                url: imageUrl,
              });
          })
          .catch((err) => {
            res.status(500).send({ err: err.message });
          });
      } else if (req.body.type === 2) {
        console.log("2");

        return res
          .status(200)
          .send({
            code: "200",
            status: "success",
            total_employees: resolvedEmployees.length,
            employees: resolvedEmployees,
          });
      } else {
        res
          .status(400)
          .send({
            code: "400",
            status: "failed",
            message: "please type 1 or 2 to get data",
          });
      }
    }
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});



//getAttendanceDataWithType
app.post('/getAttendanceDataWithType', async (req, res) => {
  try {
    console.log("getAttendanceDataWithType api");

    const combinedData = await db('ptr_attendance')
    .select(
      'ptr_attendance.employee_id',
      'ptr_attendance.attendance_type',
      'ptr_attendance.attendance_start',
      'ptr_attendance.attendance_end',
      'ptr_attendance.attendance_is_login',
      'ptr_employees.employee_no',
      'ptr_employees.employee_name',
      'ptr_employees.employee_email',
      'ptr_employees.employee_mobile',
      'ptr_employees.employee_gender',
      'ptr_employees.employee_designation',
      'ptr_employees.employee_company',
      'ptr_employees.employee_marital_status',
      'ptr_employees.employee_religion',
      'ptr_employees.employee_dob',
      //'ptr_employees.employee_fathers_name'
    )
    .join('ptr_employees', 'ptr_attendance.employee_id', 'ptr_employees.employee_id')
    .orderBy('ptr_attendance.attendance_id', 'desc');
  
  const mappedData = combinedData.map((record) => {
    const attendanceType = record.attendance_type;
    switch (attendanceType) {
      case 1:
        return { ...record, attendance_type: 'Normal' };
      case 2:
        return { ...record, attendance_type: 'Lunch' };
      case 3:
        return { ...record, attendance_type: 'Break' };
      default:
        return record;
    }
  });
  
  const mappedData1 = mappedData.map((record) => {
    const attendanceType = record.employee_gender;
    switch (attendanceType) {
      case 1:
        return { ...record, employee_gender: 'Male' };
      case 2:
        return { ...record, employee_gender: 'Female' };
      default:
        return record;
    }
  });
  //console.log("mappedData1",mappedData1)
   
    if (mappedData1.length === 0) {
      return res.status(400).send({ code: "400", status: "failed", response: "db data is not found" });
    } else {
      if (req.body.type === 1) {
        console.log("Exporting data to Excel");

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet();

        const columnHeaders = Object.keys(mappedData1[0]);
        worksheet.addRow(columnHeaders);

        mappedData.forEach((mappedDataRecord) => {
          const rowData = Object.values(mappedDataRecord);
          worksheet.addRow(rowData);
        });

        const filename = 'data/attendanceExcel.xlsx';
        workbook.xlsx.writeFile(filename)
          .then(() => {
            const baseUrl = `http://192.168.101.8:${process.env.PORT || 3000}`;
            const imageUrl = `${baseUrl}/attendanceExcel.xlsx`;
            return res.status(200).send({ code: "200", status: "success", message: "data successfully exported", url: imageUrl });
          })
          .catch((err) => {
            res.status(500).send({ error: err.message });
          });
      } else if (req.body.type === 2) {
        console.log("Fetching attendance data with employee details");
      
      return res.status(200).send({
        code: "200",
        status: "success",
        total_attendances: mappedData1.length,
        attendances: mappedData1,
      });
      
      } else {
        res.status(400).send({ code: "400", status: "failed", message: "please type 1 or 2 to get data" });
      }
    }
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});



// const calculateWorkingDays = (attendanceList, type) => {
//   const currentDate = new Date();
//   let workingDays = 0;

//   attendanceList.forEach((attendance) => {
//     const attendanceStart = new Date(attendance.attendance_start);
//     let attendanceEnd=new Date(attendance.attendanceEnd);

//     if (attendance.attendance_end) {
//       attendanceEnd = new Date(attendance.attendance_end);
//     } else {
//       attendanceEnd = currentDate;
//     }

//     const timeDifference = Math.abs(attendanceEnd - attendanceStart); 
//     const daysDifference = Math.ceil(timeDifference / (1000 * 60 * 60 * 24));

//     if (attendance.attendance_end !== null) {
//       for (let i = 0; i < daysDifference; i++) {
//         const currentDate = new Date(attendanceStart);
//         currentDate.setDate(currentDate.getDate() + i);
//         if (type === 1) {
//           if (currentDate.getDay() !== 6 && currentDate.getDay() !== 0) {
//             workingDays++;
//           }
//         } else {
//           if (currentDate.getDay() !== 0) {
//             workingDays++;
//           }
//         }
//       }
//     }
//   });
//   console.log("workingDays", workingDays);
//   return workingDays;
// };



// const calculateWorkingDays = (attendanceList) => {
//   let workingDays = 0;

//   attendanceList.forEach((attendance) => {
//     const attendanceStart = attendance.attendance_start

//     const attendanceEnd = attendance.attendance_end? attendance.attendance_end: null;

//     if (attendanceStart) {
//       const timeDifferenceMillis = attendanceEnd ? Math.abs(attendanceEnd - attendanceStart) : 0;
//       const totalSeconds = Math.floor(timeDifferenceMillis / 1000);
//       const hours = Math.floor(totalSeconds / 3600);
//       const minutes = Math.floor((totalSeconds % 3600) / 60);
//       const secondsRemaining = totalSeconds % 60;

//       //console.log('for',attendanceStart,attendanceEnd);

//       const formattedDuration = `${hours} hours, ${minutes} minutes, ${secondsRemaining} seconds`;
//       console.log('formattedDuration',formattedDuration)
//       if (attendanceEnd) {
//         if (hours > 8 || (hours === 8 && minutes === 0 && secondsRemaining === 0)) {
//           console.log("1")
//           workingDays += 1;
//         } else {
//           console.log("2")

//           workingDays += 0.5;
//         }
//       } if (attendanceStart && attendanceEnd) {
//         const daysDifference = Math.ceil(formattedDuration / 8); 
  
//         for (let i = 0; i < daysDifference; i++) {
//           const currentDate = new Date(attendanceStart);
//           currentDate.setDate(currentDate.getDate() + i);
//             if (currentDate.getDay() !== 0) {
//               workingDays += 1; 
//             }
        
//         }
//       }
//     }
//   });

//   return workingDays;
// };

// const calculateWorkingDays = (attendanceList) => {
//   let workingDays = 0;

//   attendanceList.forEach((attendance) => {
//     const attendanceStart = moment1.utc(attendance.attendance_start).tz(targetTimezone);
//     const attendanceEnd = attendance.attendance_end ? moment1.utc(attendance.attendance_end).tz(targetTimezone) : null;

//     if (attendanceStart.isValid()) {
//       const duration = moment1.duration(attendance.attendance_end - attendance.attendance_start);
//       const hours = duration.asHours(); 

//       console.log('hours',hours)
//       console.log('for', attendanceStart, attendanceEnd);

//       if (attendanceEnd) {
//         if (hours >= 8) {
//           console.log("1");
//           workingDays += 1;
//         } else if (hours > 0) {
//           console.log("0.5");
//           workingDays += 0.5;
//         }
//       }

//       if (attendanceStart && attendanceEnd) {
//         const daysDifference = duration.asDays(); 

//         for (let i = 0; i <= Math.ceil(daysDifference); i++) {
//           const currentDate = moment1(attendanceStart).add(i, 'days');
//           if (currentDate.day() !== 0) {
//             workingDays += 1; 
//           }
//         }
//       }
//     }
//   });

//   return workingDays;
// };




// const calculateWorkingDays = (attendanceList,type) => {
//   let workingDays = 0;

//   attendanceList.forEach((attendance) => {
//     const attendanceStart = attendance.attendance_start;
//     const attendanceEnd = attendance.attendance_end;

//     if (attendanceStart && attendanceEnd !== null) {
//       const timeDifferenceMillis = Math.abs(attendanceEnd - attendanceStart);
//       const totalSeconds = Math.floor(timeDifferenceMillis / 1000);
//       const hours = Math.floor(totalSeconds / 3600);
//       const minutes = Math.floor((totalSeconds % 3600) / 60);
//       const secondsRemaining = totalSeconds % 60;

//       const formattedDuration = `${hours} hours, ${minutes} minutes, ${secondsRemaining} seconds`;
//       console.log("formattedDuration",formattedDuration)

//       if (hours > 8 || (hours === 8 && minutes === 0 && secondsRemaining === 0)) {
//         workingDays += 1;
//       } else {
//         workingDays += 0.5;
//       }
//     }
//   });

//   return workingDays;
// };

// const calculateWorkingDays = (attendanceList, type) => {
//   let workingDays = 0;

//   attendanceList.forEach((attendance) => {
//     const attendanceStart = attendance.attendance_start;
//     const attendanceEnd = attendance.attendance_end;

//     if (attendanceStart && attendanceEnd !== null) {
//       const timeDifferenceMillis = Math.abs(attendanceEnd - attendanceStart);
//       const totalSeconds = Math.floor(timeDifferenceMillis / 1000);
//       const hours = Math.floor(totalSeconds / 3600);
//       const minutes = Math.floor((totalSeconds % 3600) / 60);
//       const secondsRemaining = totalSeconds % 60;

//       const formattedDuration = `${hours} hours, ${minutes} minutes, ${secondsRemaining} seconds`;
//       console.log("formattedDuration", formattedDuration);

//       const daysDifference = Math.ceil(timeDifferenceMillis / (1000 * 60 * 60 * 24));

//       if (attendance.attendance_end !== null) {
//         for (let i = 0; i < daysDifference; i++) {
//           const currentDate = new Date(attendanceStart);
//           currentDate.setDate(currentDate.getDate() + i);

//           if (type === 1) {
//             if (currentDate.getDay() !== 6 && currentDate.getDay() !== 0) {
//               if (hours > 8 || (hours === 8 && minutes === 0 && secondsRemaining === 0)) {

//                 workingDays += 1;
//                 console.log("3",workingDays)
        
//               } else {
        
//                 workingDays += 0.5;
//                 console.log("4",workingDays)
        
//               }
    
//               // workingDays++;
//               // console.log("1",workingDays)

//             }
//           } else if (type === 2) {
//             if (currentDate.getDay() !== 0) {

//               if (hours > 8 || (hours === 8 && minutes === 0 && secondsRemaining === 0)) {

//                 workingDays += 1;
//                 console.log("3",workingDays)
        
//               } else {
        
//                 workingDays += 0.5;
//                 console.log("4",workingDays)
        
//               }
//               // workingDays++;
//               // console.log("2",workingDays)

//             }
//           }
//         }
//       }

//       // if (hours > 8 || (hours === 8 && minutes === 0 && secondsRemaining === 0)) {

//       //   workingDays += 1;
//       //   console.log("3",workingDays)

//       // } else {

//       //   workingDays += 0.5;
//       //   console.log("4",workingDays)

//       // }
//     }
//   });

//   return workingDays;
// };










const calculateWorkingDays = (attendanceList, type) => {
  let workingDays = 0;

  attendanceList.forEach((attendance) => {
    const attendanceStart = attendance.attendance_start;
    const attendanceEnd = attendance.attendance_end;

    if (attendanceStart !== null && attendanceEnd !== null) {
      const timeDifferenceMillis = Math.abs(attendanceEnd - attendanceStart);
      const totalSeconds = Math.floor(timeDifferenceMillis / 1000);
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const secondsRemaining = totalSeconds % 60;

      const formattedDuration = `${hours} hours, ${minutes} minutes, ${secondsRemaining} seconds`;
       console.log("formattedDuration", formattedDuration);
      const daysDifference = Math.ceil(timeDifferenceMillis / (1000 * 60 * 60 * 24));

      for (let i = 0; i < daysDifference; i++) {
        const currentDate = new Date(attendanceStart);
        currentDate.setDate(currentDate.getDate() + i);

        if (type === 1 && currentDate.getDay() !== 6 && currentDate.getDay() !== 0) {
          if (hours > 8 || (hours === 8 && minutes === 0 && secondsRemaining === 0)) {
            workingDays += 1;
            console.log('1',workingDays)
          } else {
            workingDays += 0.5;
            console.log('2',workingDays)

          }
        } else if (type === 2 && currentDate.getDay() !== 0) {
          if (hours > 8 || (hours === 8 && minutes === 0 && secondsRemaining === 0)) {
            workingDays += 1;
            console.log('3',workingDays)

          } else {
            workingDays += 0.5;
            console.log('4',workingDays)

          }
        }
        
      }
    }
  });

  return workingDays;
};



app.post('/workinDaysEmployee', async (req, res) => {
  try {
    console.log("workinDaysEmployee api")
    let empId=req.body.employee_id;
    let type=req.body.type;
  
    const attendance = await db('ptr_attendance')
      .select('attendance_start', 'attendance_end')
      .orderBy('attendance_id', 'desc')
      .where('employee_id', empId);

    if (attendance.length === 0) {
      return res.status(400).send({ code: "400", status: "failed", response: "data is not found in db" });
    } else {
      const workingDays = calculateWorkingDays(attendance,type);
      return res.status(200).send({
        code: "200",
        status: "success",
        total_attendance: attendance.length,
        working_days: workingDays,
         //attendances: attendance,
      });
    }
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});





//excelBulkUpload api 
app.post("/excelBulkUpload",async (req, res) => {
  console.log('excelBulkUpload api')
  if (!req.files || !req.files.file) {
    return res.status(400).json({ message: "No file uploaded" });
  }

  const file = req.files.file;
  const uploadFilePath = path.join(__dirname, file.name);

  file.mv(uploadFilePath, (err) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "File upload failed" });
    }

    importExcelDataToSQL(uploadFilePath)
      .then(() => {
        res.json({ message: "File upload successful" });
      })
      .catch((err) => {
        console.error(err);
        res.status(500).json({ message: "Error importing data to SQL" });
      });
  });
});


async function importExcelDataToSQL(filePath) {
  try {
    const workBook = xlsx.readFile(filePath);
    const workSheet = workBook.Sheets[workBook.SheetNames[0]];
    const range = xlsx.utils.decode_range(workSheet["!ref"]);

    for (let row = range.s.r + 1; row <= range.e.r; row++) {
      const data = {};

      for (let col = range.s.c; col <= range.e.c; col++) {
        const cell = workSheet[xlsx.utils.encode_cell({ r: row, c: col })];
        const headerCell = workSheet[xlsx.utils.encode_cell({ r: range.s.r, c: col })];
        const header = headerCell ? headerCell.v : "";

        data[header] = cell ? cell.v : null;
      }
      console.log('data',data)

      await db("ptr_employees").insert(data);
    }
  } catch (err) {
    console.error(err);
    throw err; 
  }
}


