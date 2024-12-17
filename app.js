const app1=require("express")
const mongoose=require("mongoose")
const app=app1()
const xlsx = require('xlsx');
const cors=require("cors")
const bodyParser=require("body-parser")
const session = require('express-session');
app.use(bodyParser.urlencoded({extended:true}))
app.use(bodyParser.json())
app.use(cors())
const MongoDB=require("./MongoDB/mongoose")
const Modeluser=require("./models/UserModel")
const UserModel = require("./models/UserModel")
const bcrypt=require("bcryptjs")
const { randomInt } = require("crypto")
const HRModel=require("./models/HRModel")
const JobModel=require("./models/JobsModule")
const cookieparser=require("cookie-parser")
const jwt = require("jsonwebtoken"); 
const InternshipModel=require("./models/InternshipModule")
const ApplicationModel = require("./models/ApplicationModel");
const nodemailer=require("nodemailer")
const multer=require("multer")
const path=require("path")
const fs=require("fs")
const twilio = require('twilio');
const OtpModel=require("./models/OTPModel")
const OTP_EXPIRY = 300000; // 5 minutes in milliseconds
const otpCache = new Map(); // For storing OTP temporarily (use Redis for production)
const cron = require("node-cron");
 

const accountSid = "AC037ecde50f490b48f10796c161d9177b";
const authToken = "407e0506eca1992bb2a7db82e1797ca0";
const sandboxNumber ="+14155238886"; // Twilio Sandbox Number


const client=twilio(accountSid,authToken,sandboxNumber)



function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000);  
  }

  async function sendOTPToWhatsApp(phoneNumber, otp) {
    try {
      const message = await client.messages.create({
        body: `Your OTP is: ${otp}`,
        from: process.env.TWILIO_WHATSAPP_SANDBOX, // This is the WhatsApp sandbox number
        to: `whatsapp:${phoneNumber}` // User's phone number with "whatsapp:" prefix
      });
      return message;
    } catch (error) {
      console.error('Error sending OTP via WhatsApp:', error);
      throw error;
    }
  }
app.use(app1.json())
app.use(cookieparser())

cron.schedule("*/5 * * * *", async () => {
    console.log("Clearing OTP database: Removing all OTP entries...");
  
    try {
      // Delete all records in the OTP collection
      await OtpModel.deleteMany({});
      console.log("All OTP entries have been successfully removed.");
    } catch (error) {
      console.error("Error while clearing OTP database:", error);
    }
  });


const storage = multer.memoryStorage();
const upload = multer({ storage });
 
 

const transporter=nodemailer.createTransport({
    service:"gmail",
    auth:{
        user:"maitreyaguptaa@gmail.com",
        pass: "krnl yeni jnsy iwgu",
    },
});

// Middleware to check if the user is authenticated
const isAuthenticated = (req, res, next) => {
    const userId = req.cookies.userId;
    if (!userId) {
        return res.status(401).json({
            success: false,
            message: "Unauthorized: No user session found"
        });
    }
    // If userId exists in the cookies, continue with the request
    next();
};
app.listen(2000,function(req,res){
    console.log("Listening")
})

app.get("/",function(req,res){
    console.log("Home Route");
    res.send("Welcome to the Home Route!");
})

 

app.post('/signup', async (req, res) => {
    const { name, password, contact } = req.body;

    if (!name || !password || !contact) {
        return res.status(400).json({ success: false, message: 'All fields are required.' });
    }

    try {
        // Check if user already exists
        const existingUser = await UserModel.findOne({ name });
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'User already registered.' });
        }

        

        // Generate OTP
        const otp = Math.floor(100000 + Math.random() * 900000); // 6-digit OTP
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // OTP valid for 5 minutes

        // Store OTP in the database
        const otpData = new OtpModel({
            otp1: otp,
            expiresAt1: expiresAt
        });
        await otpData.save();
        const message = `Your OTP for registration is: ${otp}`;
        client.messages.create({
            body: message,
            from: `whatsapp:${sandboxNumber}`, // Your Twilio WhatsApp Sandbox number
            to: `whatsapp:${contact}` // The contact number provided by the user (in E.164 format)
        })
        .then((message) => {
            console.log(`OTP sent to ${contact}: ${message.sid}`);
        })
        .catch((error) => {
            console.error('Error sending OTP via WhatsApp:', error);
        });


        // Simulate sending OTP (use a real SMS service here)
        console.log(`OTP for ${contact}: ${otp}`);

        // Set cookies (store only non-sensitive data)
        res.cookie("name", name, { httpOnly: true, maxAge: 3600000 });
        res.cookie("contact", contact, { httpOnly: true, maxAge: 3600000 });
        res.cookie("Password",password,{ httpOnly: true, maxAge: 3600000 })

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new UserModel({ 
            name: req.body.name, 
            password: hashedPassword, 
            contact: req.body.contact 
        });
        await newUser.save();

        // Send response with success message and details
        res.status(200).json({
            success: true,
            message: 'User registered successfully. OTP sent to the contact.',
        });
    } catch (error) {
        console.error('Error during signup:', error);
        res.status(500).json({ success: false, message: 'Internal server error.' });
    }
});



// Verify OTP Route
app.post('/verifyOTP', async (req, res) => {
    const {otp} = req.body;
    const name=req.cookies.name;

    if ( !otp) {
        return res.status(400).json({ message: 'Contact and OTP are required.' });
    }

    try {
        const otpEntry = await OtpModel.findOne({ otp1:otp });

        if (!otpEntry) {
            await UserModel.deleteOne({name:name})
            return res.status(400).json({ message: 'OTP not found.' });
         
        }

        // Check OTP expiration
        if (otpEntry.expiresAt < new Date()) {
            await UserModel.deleteOne({name:name})
            return res.status(400).json({ message: 'OTP has expired.' });
     
        }

        // Validate OTP
        if (otpEntry.otp1 !== parseInt(otp, 10)) {
            return res.status(400).json({ message: 'Invalid OTP.' });
         
        }
        console.log(req.cookies.Password)
        // OTP verified successfully, create the user
     

        // Cleanup OTP from the database
        await OtpModel.deleteOne({ otp});

        // No JWT generation here

        res.status(201).json({ message: 'Signup successful!' });
    } catch (error) {
        console.error('Error during OTP verification:', error);
        await UserModel.deleteOne({name:name})
        res.status(500).json({ message: 'Internal server error.' });
    }
});
 

app.post("/login", async function (req, res) {
    const { name,password } = req.body; // Destructure name and password
    
    // Validate input
    if (!name || !password) {
        return res.status(400).json({
            success: false,
            message: "Name and password are required"
        });
    }

    try {
        // Find the user by name
        const user = await UserModel.findOne({ name: name });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "Invalid Login: User not found"
            });
        }

        // Compare the entered password with the hashed password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: "Invalid Login: Incorrect password"
            });
        }
         // Set the userId in a cookie
         res.cookie('userId', user._id, {
            httpOnly: true,   // Ensures the cookie is not accessible via JavaScript
            maxAge: 3600000   // Cookie expiration time (1 hour)
        });
        console.log(user._id);
        // If the user is found and the password matches
        res.status(200).json({
            success: true,
            message: "User Found. Login Successful",
            user: {
                name: user.name,
                contact: user.contact,  // Optionally include more user details if needed
                avatar: user.avatar
            }
        });
    } catch (err) {
        console.error("Error in Login page:", err.message);
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: err.message
        });
    }
});


app.post(
    "/signupHR",
    upload.fields([
      { name: "aadharCard", maxCount: 1 },
      { name: "PANCard", maxCount: 1 },
    ]),
    async (req, res) => {
      try {
        const { name, password, contact } = req.body;
        const aadharCard = req.files?.aadharCard?.[0];
        const PANCard = req.files?.PANCard?.[0];
  
        if (!name || !password || !contact || !aadharCard || !PANCard) {
          return res.status(400).json({ message: "All fields are required." });
        }
  
        // Check if HR already exists
        const existingHR = await HRModel.findOne({ name });
        if (existingHR) {
          return res
            .status(400)
            .json({ success: false, message: "HR already registered." });
        }
  
        // Generate OTP
        const otp = Math.floor(100000 + Math.random() * 900000); // 6-digit OTP
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // Valid for 5 minutes
  
        // Store OTP in database
        const otpData = new OtpModel({
          otp1: otp,
          expiresAt1: expiresAt,
        });
        await otpData.save();
  
        // Simulate sending OTP via WhatsApp
        const message = `Your OTP for HR registration is: ${otp}`;
        client.messages
          .create({
            body: message,
            from: `whatsapp:${sandboxNumber}`, // Twilio Sandbox Number
            to: `whatsapp:${contact}`,
          })
          .then((message) => {
            console.log(`OTP sent to ${contact}: ${message.sid}`);
          })
          .catch((error) => {
            console.error("Error sending OTP:", error);
          });
  
        console.log(`OTP for ${contact}: ${otp}`);
  
        // Store user details temporarily (cookie-based approach)
        res.cookie("HR_name", name, { httpOnly: true, maxAge: 3600000 });
        res.cookie("HR_contact", contact, { httpOnly: true, maxAge: 3600000 });
        res.cookie("HR_password", password, { httpOnly: true, maxAge: 3600000 });

        const hashedPassword = await bcrypt.hash(password, 10);
    
        const newHR = new HRModel({
          name,
          password: hashedPassword,
          contact,
          aadharCard,
          PANCard,
        });
        await newHR.save();
  
        // Return response
        res.status(200).json({
          success: true,
          message: "OTP sent to the contact. Verify to complete registration.",
        });
      } catch (error) {
        console.error("Error during HR signup:", error);
        res.status(500).json({ message: "Internal server error." });
      }
    }
  );
  app.post('/VerifyOTP_HR', async (req, res) => {
    const { otp } = req.body;
    const name = req.cookies.HR_name;
    const contact = req.cookies.HR_contact;
    const password = req.cookies.HR_password;

    console.log(password)
  
    if (!otp) {
      return res.status(400).json({ message: "OTP is required." });
    }
  
    try {
      const otpEntry = await OtpModel.findOne({ otp1: otp });
  
      if (!otpEntry) {
        await HRModel.deleteOne({name:name})
        return res.status(400).json({ message: "Missing OTP." });
      }
  
      // Check OTP expiration
      if (otpEntry.expiresAt1 < new Date()) {
        await OtpModel.deleteOne({ otp1: otp });
        await HRModel.deleteOne({name:name})
        return res.status(400).json({ message: "OTP has expired." });
        
      }
      if (otpEntry.otp1 !== parseInt(otp, 10)) {
        return res.status(400).json({ message: 'Invalid OTP.' });
     
    }
  
      // OTP is valid - proceed with final HR creation
    
  
      // Cleanup OTP entry
      await OtpModel.deleteOne({ otp1: otp });
  
       
      res.status(201).json({ message: "HR signup successful!" });
    } catch (error) {
      console.error("Error during HR OTP verification:", error);
      res.status(500).json({ message: "Internal server error." });
    }
  });
    
  

  app.post("/loginHR", async function(req, res) {
    const { name, password } = req.body;  // Destructure name and password from request body

    // Validate input
    if (!name || !password) {
        return res.status(400).json({
            success: false,
            message: "Name and password are required"
        });
    }

    try {
        // Find the user by name
        const user = await HRModel.findOne({ name: name });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "Invalid Login: User not found"
            });
        }

        // Compare the entered password with the hashed password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: "Invalid Login: Incorrect password"
            });
        }

        // Set the userId in a cookie
        res.cookie('userId', user._id.toString(), {
            httpOnly: true,    // Cookie is not accessible via JavaScript
            secure: process.env.NODE_ENV === 'production', // Secure cookies for production (HTTPS)
            maxAge: 3600000    // Cookie expiration time (1 hour)
        });

        // If the user is found and the password matches, send the response
        res.status(200).json({
            success: true,
            message: "User Found. Login Successful",
            user: {
                name: user.name,
                contact: user.contact  // Optionally include other user details if needed
            }
        });

    } catch (err) {
        console.error("Error during login:", err.message);
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: err.message
        });
    }
});

app.get("/user/profile", isAuthenticated, async (req, res) => {
    try {
        const userId = req.cookies.userId;
        console.log('User ID:', userId); 
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized: No session found"
            });
        }

        // Fetch user from the database using the userId from the cookie
        const user = await UserModel.findById(userId).select("name avatar contact");
        console.log(user)
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        res.status(200).json({
            success: true,
            user: {
                name: user.name,
                avatar: user.avatar,
                contact: user.contact
            }
        });
    } catch (err) {
        console.error("Error in GET /user/profile:", err.message);
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: err.message
        });
    }
});

 
app.post("/JobPost",async function(req,res){
    const  data={
        name:req.body.name,
        description:req.body.description,
        vacancy:req.body.vacancy,
        immidiateHiring:req.body.immidiateHiring
    }
    try{
        JobPost=await JobModel.findOne(data)
        if(!JobPost)
            {
                const NewJob=new JobModel({
                    name:data.name,
                    description:data.description,
                    vacancy:data.vacancy,
                    immediateHiring:data.immidiateHiring
            })
            await NewJob.save()
            res.status(200).json({

                message:"Model is saved",
                success:true,
                JobModel:NewJob,
            })
            }
        else{
            res.status(500).json("Model Already exists")
        }
    }
    catch(error)
    {
        res.json(error)
    }

})
app.post("/InternshipPost",async function(req,res){
    const  data={
        name:req.body.name,
        description:req.body.description,
        vacancy:req.body.vacancy,
        immidiateHiring:req.body.immidiateHiring
    }
    try{
        InternPost=await InternshipModel.findOne(data)
        if(!InternPost)
            {
                const NewIntern=new InternshipModel({
                    name:data.name,
                    description:data.description,
                    vacancy:data.vacancy,
                    immidiateHiring:data.immidiateHiring
            })
            await NewIntern.save()
            res.json({

                message:"Model is saved",
                success:true,
                InternshipModel:NewIntern,
            })
            res.redirect("/")
            }
        else{
            res.json("Model Already exists")
        }
    }
    catch(error)
    {
        console.log(error)
    }
})
app.get("/JobPost", async function (req, res) {
    try {
        // Fetch all job postings
        const jobs = await JobModel.find();

        if (jobs.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No jobs found"
            });
        }

        res.status(200).json({
            success: true,
            jobs: jobs
        });
    } catch (err) {
        console.error("Error fetching jobs:", err.message);
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: err.message
        });
    }
});
app.get("/InternshipPost", async function (req, res) {
    try {
        // Fetch all job postings
        const jobs = await InternshipModel.find();

        if (jobs.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No Internships found"
            });
        }

        res.status(200).json({
            success: true,
            jobs: jobs
        });
    } catch (err) {
        console.error("Error fetching Internships:", err.message);
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: err.message
        });
    }
});
app.post("/ApplyNow", isAuthenticated, async function (req, res) {
    const { job_name, timestamp } = req.body;  // Using job_name instead of job_id

    // Validate request body
    if (!job_name || !timestamp) {
        return res.status(400).json({
            success: false,
            message: "Missing required fields: job_name or timestamp.",
            timestamp: new Date().toISOString(),
            job_name: null,
        });
    }

    try {
        const userId = req.cookies.userId; // Get userId from the cookies

        // Check if the job exists using job_name
        const job = await JobModel.findOne({ name: job_name });  // Searching job by job_name

        if (!job) {
            return res.status(404).json({
                success: false,
                message: "Job not found.",
                timestamp: new Date().toISOString(),
                job_name: job_name,
            });
        }

        // Check for duplicate application using job_name and userId
        const existingApplication = await ApplicationModel.findOne({ job_name, userId });
        if (existingApplication) {
            return res.status(409).json({
                success: false,
                message: "You have already applied for this job.",
                timestamp: new Date().toISOString(),
                job_name: job_name,
            });
        }

        // Save new application
        const newApplication = new ApplicationModel({
            job_name,
            applicant_name: userId,  // Set applicant_name to userId
            timestamp,
            userId,
        });

        await newApplication.save();

        // Decrease the vacancy count by 1 in the JobModel
        job.vacancy -= 1;
        await job.save();
        const user = await UserModel.findById(userId); 
        username=user.name
        
        sendApplicationEmail(userId, job_name,timestamp,username);
        updateExcelSheet(username,job_name,timestamp)
        // Send success response
        return res.status(201).json({
            success: true,
            message: "Application submitted successfully.",
            timestamp: new Date().toISOString(),
            job_name: job_name,
        });

        // Send an email to Maitreya Gupta about the successful application
      

    } catch (error) {
        console.error("Error in /ApplyNow:", error);

        // Send error response
        return res.status(500).json({
            success: false,
            message: "Application Failed",
            timestamp: new Date().toISOString(),
            job_name: null,
        });
    }
});

// Function to send the application email
async function sendApplicationEmail(userId, job_name,timestamp,username) {
    const transporter = nodemailer.createTransport({
        service: 'gmail', // Use your email provider (e.g., 'gmail')
        auth: {
            user: 'maitreyaguptaa@gmail.com', // Replace with your email
            pass: 'krnl yeni jnsy iwgu',   // Replace with your email password or app password
        },
    });

    const mailOptions = {
        from: 'maitreyaguptaa@gmail.com', // Sender address
        to: 'maitreyaguptaa@gmail.com',  // Recipient email
        subject: `Application for Job: ${job_name}`,
        text: `User ID: ${userId} with name:${username} has successfully applied for the job: ${job_name} on Date: ${timestamp}.`,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('Email sent successfully.');
    } catch (error) {
        console.error('Error sending email:', error);
    }
}
 
 

// Function to update the Excel sheet with application details
async function updateExcelSheet(userName, job_name, timestamp) {
    try {
        // Path to the Excel file
        const filePath = path.join(__dirname, 'applications.xlsx');

        // Check if the Excel file exists
        let workbook;
        let worksheet;
        let data = [];

        if (fs.existsSync(filePath)) {
            // Read the existing Excel file
            workbook = xlsx.readFile(filePath);
            worksheet = workbook.Sheets[workbook.SheetNames[0]]; // Get the first sheet

            // Convert the worksheet into an array of arrays (AOA)
            data = xlsx.utils.sheet_to_json(worksheet, { header: 1 });
            console.log("File exists. Reading the existing workbook.");
        } else {
            // If the file doesn't exist, create a new one with headers
            data = [['UserName', 'JobName', 'Timestamp']]; // Header row
            console.log("File does not exist. Creating a new workbook with headers.");
        }

        // Prepare the new row to append
        const newRow = [userName, job_name, timestamp];

        // Append the new row to the data
        data.push(newRow);
        console.log("Data after appending:", data);

        // Create a new worksheet from the updated data
        worksheet = xlsx.utils.aoa_to_sheet(data);

        // Create a new workbook and append the worksheet
        workbook = xlsx.utils.book_new();
        xlsx.utils.book_append_sheet(workbook, worksheet, 'Applications');

        // Write the updated workbook to the file
        xlsx.writeFile(workbook, filePath);
        console.log('Excel sheet updated successfully.');
    } catch (error) {
        console.error('Error updating Excel sheet:', error);
    }
}

 
