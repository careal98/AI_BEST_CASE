import express from "express";
import { connectDB } from "./src/db.js";
import dotenv from "dotenv";
import cors from "cors";

const app = express();
dotenv.config();

const corsOptions = {
    // origin: "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST"],
    optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.use(express.json());
// ai 추천이 이미 베스트 리뷰로 선정된 카운트
app.get("/server/api/check/count", async (req, res) => {
    const { year, month, doctorId } = req.query;
    try {
        const sql = ` SELECT 고객번호 as psEntry 
                FROM tsfmc_mailsystem.dbo.MAIL_OPE_BEST_CASE AS M, tsfmc_mailsystem.dbo.MAIL_OPE_BEST_CASE_AI AS A
                WHERE A.Doctor_Id COLLATE Korean_Wansung_CI_AS = '${doctorId}' COLLATE Korean_Wansung_CI_AS
                AND A.[Year] = ${year}
                AND A.[Month] = ${month} AND A.Psentry COLLATE Korean_Wansung_CI_AS = M.고객번호 COLLATE Korean_Wansung_CI_AS 
                AND A.Doctor_Id COLLATE Korean_Wansung_CI_AS = M.수술의ID COLLATE Korean_Wansung_CI_AS            
                AND EXISTS (
                    SELECT 1 
                    FROM tsfmc_mailsystem.dbo.IMAGE_SECTION_INFO AS I
                    WHERE A.Psentry = I.surgeryID
                    AND A.Op_Date >= I.op_data
                    AND A.Surgical_Site COLLATE Korean_Wansung_CI_AS = I.section COLLATE Korean_Wansung_CI_AS
                )
                AND EXISTS (
                    SELECT 1 
                    FROM tsfmc_mailsystem.dbo.IMAGE_SECTION_INFO AS I
                    WHERE A.Psentry = I.surgeryID
                    AND A.Op_Date < I.op_data
                    AND A.Surgical_Site COLLATE Korean_Wansung_CI_AS = I.section COLLATE Korean_Wansung_CI_AS
                )`;
        const results = await connectDB(sql);
        res.setHeader('Content-Type', 'application/json');    
        res.status(200).json(results);
    } catch {}
});
app.listen(5000, () => {
    console.log('app is running on port 3002');
});