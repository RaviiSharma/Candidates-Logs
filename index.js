
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
              //___________________________________________________company_logo
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
//_____________aws upload file,mail

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
      if (!isValidInputValue(company_email) ||!isValidEmail(company_email)) {
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

//_______________________________________________get company with company logo url_________________________________

  app.post('/getCompany', async (req, res) => {
    try {
      const company_id = req.body.company_id;
      console.log("company_id",company_id)

      if (
        !company_id ||
        !isValidInputValue(company_id) 
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

    if (!organization_id || !isValidInputValue(organization_id)) {
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

      if (isValidInputValue(candidate_id)) {
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



//___________________--------------- editemployee -------------------______________________

//kaam baki hai mere dost

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


app.put('/editemployee/:employee_id' , async (req, res) => {
  try {
    const data = req.body;

   
    let employee_photo=req.files;
    console.log("employee_photo",employee_photo)
    
   // employee_id=req.params.employee_id
    console.log("data",data)

    let store={};

    
    if (!isValidInputValue(req.params.employee_id)) {return res.status(400).send({status: false,message: "employee_id is required and should contain only alphabets",});}

    ///----------------------------------------employee_photo --------------------------------

    if(employee_photo !==null) {

      if ( employee_photo == undefined) {
        return res.status(400).send({ status: false, message: "Only employee_photo required " });
      }
  
    let k=await db("ptr_employees").select("employee_no").where("employee_id",req.params.employee_id)
    console.log("k",k[0].employee_no)
    
    const uploadedUrl = await uploadFile2(req.files.employee_photo,k[0].employee_no);
    console.log("uploadedUrl >", uploadedUrl)
  
    store["employee_photo"] =k[0].employee_no
    
    }


    if (data.employee_name) {
      if(!isValidInputValue(data.employee_name.trim()) || !isValidOnlyCharacters(data.employee_name.trim())){
        return res.status(400).send({status: false,message: "employee_name is required and should contain only alphabets",});

      }
      store["employee_name"]=data.employee_name;
    }

    if (data.employee_fathers_name) {
      if(!isValidInputValue(data.employee_fathers_name.trim()) || !isValidOnlyCharacters(data.employee_fathers_name.trim())){
        return res.status(400).send({status: false,message: "employee_fathers_name is required and should contain only alphabets",});

      }
      store["employee_fathers_name"]=data.employee_fathers_name;
    }
    
    if (data.employee_password) {
      if(!isValidInputValue(data.employee_password.trim()) || !data.employee_password.match(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{4,}$/)){
        return res.status(400).send({status: false,message: "employee_password is required and should contain At least 4 characters long  one letter (uppercase or lowercase) one digit",});

      }
      store["employee_password"]=data.employee_password;
    }
    
    if (data.employee_gender) {
      
      if (!isValidInputValue(data.employee_gender.trim()) || !/^\d+$/.test(data.employee_gender.trim()) || !['1', '2'].includes(data.employee_gender.trim())) {
        return res.status(400).send({ status: false, message: "employee_gender is required and should contain only 1 or 2" });
      }
      
      store["employee_gender"] = data.employee_gender;
      
    }
    
    if (data.employee_dob) {
      if (!isValidInputValue(data.employee_dob.trim()) || !/^\d{4}-\d{2}-\d{2}$/.test(data.employee_dob.trim())) {
        return res.status(400).send({ status: false, message: "employee_dob is required and should contain a valid date (YYYY-MM-DD)" });
      }
      
      store["employee_dob"] = data.employee_dob;
    }
    
    
    if (data.employee_email) {
      
      if (!isValidInputValue(data.employee_email.trim()) ||!isValidEmail(data.employee_email.trim())) 
    {return res.status(400).send({status: false,message: "employee_email is required and should contain only valid email",});}
    
    store["employee_email"]=data.employee_email;
        
      }
  
//     //-----------------------------------------------------------------------
if (data.employee_email) {
      
    if (!isValidInputValue(data.employee_email.trim()) ||!isValidEmail(data.employee_email.trim())) 
    {return res.status(400).send({status: false,message: "employee_email is required and should contain only valid email",});}

store["employee_email"]=data.employee_email;
    
  }

  
  if (data.employee_mobile) {
      
    if (!isValidInputValue(data.employee_mobile.trim()) ||!/^[6-9]\d{9}$/.test(data.employee_mobile)) 
    {return res.status(400).send({status: false,message: "employee_mobile is required and should contain only valid mobile number",});}

store["employee_mobile"]=data.employee_mobile;
    
  }
  if (data.employee_company) {
      
    if (!isValidInputValue(data.employee_company.trim()) ||!isValidOnlyCharacters(data.employee_company.trim())) 
    {return res.status(400).send({status: false,message: "employee_company is required and should contain only name",});}

store["employee_company"]=data.employee_company;
    
  }

  if (data.employee_designation) {
      
    if (!isValidInputValue(data.employee_designation.trim()) ||!/^\d+$/.test(data.employee_designation.trim())) 
    {return res.status(400).send({status: false,message: "employee_designation is required and should contain only valid employee_designation",});}

store["employee_designation"]=data.employee_designation;
    
  }
  

  if (data.employee_branch_type) {
    if (!isValidInputValue(data.employee_branch_type.trim()) || !/^\d+$/.test(data.employee_branch_type.trim()) || ![1, 2, 3].includes(parseInt(data.employee_branch_type))) {
      return res.status(400).send({ status: false, message: "employee_branch_type is required and should contain only valid values of 1, 2, or 3" });
    }
  
    store["employee_branch_type"] = data.employee_branch_type;
  }
  
  if (data.employee_probation_start) {
      
    if (!isValidInputValue(data.employee_probation_start.trim()) ||!/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(data.employee_probation_start.trim())) 
    {return res.status(400).send({status: false,message: "employee_probation_start is required and should contain only valid format YYYY-MM-DD HH:MM:SS"});}

store["employee_probation_start"]=data.employee_probation_start;
    
  }
  if (data.employee_probation_end) {
      
    if (!isValidInputValue(data.employee_probation_end.trim()) ||!/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(data.employee_probation_end.trim())) 
    {return res.status(400).send({status: false,message: "employee_probation_end is required and should contain only valid format YYYY-MM-DD HH:MM:SS"});}

store["employee_probation_end"]=data.employee_probation_end;
    
  }
  if (data.employee_home_address) {
      
    if (!isValidInputValue(data.employee_home_address.trim()) ||!isValidOnlyCharacters(data.employee_home_address.trim())) 
    {return res.status(400).send({status: false,message: "employee_home_address is required and should contain only valid characters "});}

store["employee_home_address"]=data.employee_home_address;
    
  }

  if (data.employee_office_address) {
      
    if (!isValidInputValue(data.employee_office_address.trim()) ||!isValidOnlyCharacters(data.employee_office_address.trim())) 
    {return res.status(400).send({status: false,message: "employee_office_address is required and should contain only valid  characters "});}


store["employee_office_address"]=data.employee_office_address;
    
  }

  if (data.employee_present_address) {
      
    if (!isValidInputValue(data.employee_present_address.trim()) ||!isValidOnlyCharacters(data.employee_present_address.trim())) 
    {return res.status(400).send({status: false,message: "employee_present_address is required and should contain only valid  characters "});}


store["employee_present_address"]=data.employee_present_address;
    
  }
    ////

    if (data.employee_type) {
      if (!isValidInputValue(data.employee_type.trim()) || !/^\d+$/.test(data.employee_type.trim()) || ![1, 2, 3, 4, 5].includes(parseInt(data.employee_type))) {
        return res.status(400).send({ status: false, message: "employee_type is required and should contain only valid values of 1, 2, 3, 4, or 5" });
      }
    
      store["employee_type"] = data.employee_type;
    }

    if (data.employee_blood_group) {
      
    if (!isValidInputValue(data.employee_blood_group.trim()) ||!isValidOnlyCharacters(data.employee_blood_group.trim())) 
    {return res.status(400).send({status: false,message: "employee_blood_group is required and should contain only valid employee_blood_group"});}

    store["employee_blood_group"] = data.employee_blood_group;
      }
    
      if (data.employee_marital_status) {
        if (!isValidInputValue(data.employee_marital_status.trim()) || !/^\d+$/.test(data.employee_marital_status.trim()) || ![0, 1, 2].includes(parseInt(data.employee_marital_status))) {
          return res.status(400).send({ status: false, message: "employee_marital_status is required and should contain only valid values of 0, 1, or 2" });
        }
      
        store["employee_marital_status"] = data.employee_marital_status;
      }


    if (data.employee_religion) {
    
    if (!isValidInputValue(data.employee_religion.trim()) ||!isValidOnlyCharacters(data.employee_religion.trim())) 
    {return res.status(400).send({status: false,message: "employee_religion is required and should contain only valid characters"});}
      
        store["employee_religion"] = data.employee_religion;
      }
      
      if (data.employee_grade) {
    
        if (!isValidInputValue(data.employee_grade.trim()) ||!isValidOnlyCharacters(data.employee_grade.trim())) 
        {return res.status(400).send({status: false,message: "employee_grade is required and should contain only valid characters"});}
    
            store["employee_grade"] = data.employee_grade;
          }
      
          if (data.employee_bank_ac_number) {
            if (!isValidInputValue(data.employee_bank_ac_number.trim()) || !isValidOnlyCharacters(data.employee_bank_ac_number.trim())) {
              return res.status(400).send({ status: false, message: "employee_bank_ac_number is required and should contain only valid characters" });
            }
          
            store["employee_bank_ac_number"] = data.employee_bank_ac_number;
          }
          
          if (data.employee_ifsc) {
            if (!isValidInputValue(data.employee_ifsc.trim()) ||!/^[A-Za-z]{4}[0][A-Za-z0-9]{6}$/.match(data.employee_ifsc.trim())) 
            {return res.status(400).send({status: false,message: "employee_ifsc is required and should contain only valid ifsc"});}
          
            store["employee_ifsc"] = data.employee_ifsc;
          }
          
          if (data.employee_name_in_bank_ac) {
            if (!isValidInputValue(data.employee_name_in_bank_ac.trim()) ||!isValidOnlyCharacters(data.employee_name_in_bank_ac.trim())) 
            {return res.status(400).send({status: false,message: "employee_name_in_bank_ac is required and should contain only valid characters"});}
          
            store["employee_name_in_bank_ac"] = data.employee_name_in_bank_ac;
          }
          
          if (data.employee_verification_status) {
            if (!isValidInputValue(data.employee_verification_status.trim()) || !/^\d+$/.test(data.employee_verification_status.trim()) || !data.employee_verification_status.includes("0") || !data.employee_verification_status.includes("1") || !data.employee_verification_status.includes("2") || !data.employee_verification_status.includes("3")) {
              return res.status(400).send({ status: false, message: "employee_verification_status is required and should contain only valid numbers (0, 1, 2, or 3)" });
            }
            
            store["employee_verification_status"] = data.employee_verification_status;
          }
          
    
          if (data.employee_verification_completed_on) {
    
            if (!isValidInputValue(data.employee_verification_completed_on.trim()) ||!/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(data.employee_verification_completed_on.trim())) 
            {return res.status(400).send({status: false,message: "employee_verification_completed_on is required and should contain only date and time"});}
          
            store["employee_verification_completed_on"] = data.employee_verification_completed_on;
          }

    
    ////
    
    if (data.employee_verification_agency) {
     
     if (!isValidInputValue(data.employee_verification_agency.trim()) ||!isValidOnlyCharacters(data.employee_verification_agency.trim())) 
    {return res.status(400).send({status: false,message: "employee_verification_agency is required and should contain only valid characters"});}
    
      store["employee_verification_agency"] = data.employee_verification_agency;
    }

    if (data.employee_no) {
      if (!isValidInputValue(data.employee_no.trim()) || !/^[a-zA-Z0-9]+$/.test(data.employee_no.trim())) {
        return res.status(400).send({ status: false, message: "employee_no is required and should contain only valid characters (alphabets and numbers)" });
      }
      
      store["employee_no"] = data.employee_no;
    }

    if (data.org_id) {

      if (!isValidInputValue(data.org_id.trim()) ||!/^\d+$/.match(data.org_id.trim())) 
      {
        return res.status(400).send({status: false,message: "org_id is required and should contain only valid number"});
    }
      store["org_id"] = data.org_id;
      }
      
  
  
// ////// 

console.log("testing")
console.log("store",store)
 
        let results = await db
          .select("*")
          .from("ptr_employees")
          .where("employee_id", req.params.employee_id);


        if (results.length !== 1) {
          return res.status(404).json(("404", "error", "Invalid emp"));
        } else {
          await db("ptr_employees").where("employee_id", req.params.employee_id).update(store);
          return res.status(200).json({code:"200",status: "success", msg:"Successfully emp Update", data:store});
        }
     
  } catch (e) {
    return res.status(500).json(("500", "error", "Something went wrong" + e, {}));
  }
});



//--------------------------------------------------------------- getEmployee with url ---------------------------------------

app.post('/getEmployee', async (req, res) => {
  try {
    const employee_id = req.body.employee_id;
    console.log("employee_id",employee_id)

    if (
      !employee_id ||
      !isValidInputValue(employee_id) 
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
          employee_name: w[0].employee_name,
          
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

          employee_name_in_bank_ac:w[0].employee_name_in_bank_ac,
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
          employee_name: w[0].employee_name,
          
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

          employee_name_in_bank_ac:w[0].employee_name_in_bank_ac,
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

//------------------------------------------------- getBdayWish -----------------------------------------------

const moment = require('moment');

app.get('/getBdayWish', async (req, res) => {
  try {
    const today = moment().format('YY-MM-DD');
    const employees = await db('ptr_employees')
      .select('employee_name').where('employee_dob',today)

      // console.log("detaol",employees)
    
    if (employees.length === 0) {
      return res.status(400).send({ code: "400", status: "failed", response: "no Data found in the database" });
    } else {

      //maping with emp_name happy birthday
      const employeeData = employees.map(async (emp) => {
     
       emp.employee_name=`Happy Birthday ${emp.employee_name}`
       
        return emp;
      });
 
      const resolvedEmployees = await Promise.all(employeeData);


      return res.status(200).send({ code: "200", status: "success",employees: resolvedEmployees });
    }
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});






//____________________________/ send mail to multiple persons /___________________

const nodemailer = require("nodemailer");
const Mailgen = require("mailgen");
app.use(express.json()); 

app.post('/sendBulkMail/:employee_id' , async(req, res) => {
  try{  employee_id=req.params.employee_id

    if(!employee_id){return res.send({code:400,status:'failed',response:'employee_id is required!'})}

       rightEMP=await db.select('employee_name','employee_email','employee_type').where('employee_id',employee_id).from("ptr_employees");

       if(rightEMP.length ==0){return res.send({code:400,status:'failed',response:`no employee found by this employee_id : ${employee_id}`})}


       console.log('rightEMP',rightEMP)

       if (![2, 5].includes(rightEMP[0].employee_type)) {return res.send({ code: 400, status: 'failed', response: 'unauthorized' });}
      
       console.log('rightEMP',rightEMP[0].employee_email)


       let authEMAIL=rightEMP[0].employee_email;
        let fromBody=req.body.intro;
        ///console.log("fromBody",fromBody)

      let emailData = await db.select("employee_email","employee_name").from("ptr_employees")
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

 