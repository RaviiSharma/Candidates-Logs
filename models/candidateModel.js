

const mongoose = require("mongoose");


const candidateSchema = new mongoose.Schema({
    candidate_id: {
        type: String,
        required: [true, "required"],
        trim: true,
    },
    candidate_name: {
        type: String,
        //required: [true, "User Name is required"],
        trim: true,
    },
    candidate_ref_no: {
        type: String,
        //required: [true, " required"],
        trim: true,
    },
    candidate_gender: {
        type: String, //1 ya 2 
       // enum:[1,2],
        trim: true,
    },
    candidate_address: {
        type: String,
       // required: [true, " required"],
        trim: true,
    },
    candidate_qualification: {
        type: String,
       // required: [true, " required"],
        trim: true,
    },
    candidate_resume: {
       /// type: String,
       // required: [true, " required"],
        //trim: true,
    },
    candidate_remarks: {
        type: String,
        //required: [true, " required"],
        trim: true,
    },
    candidate_letter: {
        type: String,
       // required: [true, " required"],
        trim: true,
    },
    candidate_company: {
        type: String,
        //required: [true, " required"],
        trim: true,
    },
    candidate_applied_dept: {
        type: String,
       // enum:[1,2,3,4,5],
        trim: true,
    },
    candidate_experience: {
        type: String, //decimal
       // required: [true, " required"],
        trim: true,
    },
    candidate_is_called: {
        type: String,
      // enum:["0","1"],
        trim: true,
    },
    candidate_status: {
        type: String,
        //enum:[1,2,3,4,5,6,7],
        trim: true,
    },
    
    candidate_email: {
        type: String,
        trim: true,
    },
   
    candidate_mobile: {
        type: String,
        trim: true,
    },
    candidate_interview_date: {
        type: String,
        //required: [true, " required"],
        trim: true,
    },
    candidate_interview_time: {
        type: String,
        //required: [true, " required"],
        trim: true,
    },
    candidate_dob:{
        type:String,trim:true
    }
   

}, { timestamps: true });

module.exports = mongoose.model('Candidate', candidateSchema)


