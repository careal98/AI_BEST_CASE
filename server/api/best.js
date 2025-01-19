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
// 베스트 선정하기
app.post("/server/api/best", async (req, res) => {
    try {
        const bestData = req.body;
        const best = bestData?.[0]?.selected;
        const unBest = bestData?.[1]?.unselected;
      // console.dir({ best, unBest });
      // 선택한 수술이 베스트 케이스에 있는 데이터
        const checkDatas = await Promise.all(
            best.map(async (v) => {
                const checkSql = `SELECT 고객번호, 수술의ID, OPDATE FROM MAIL_OPE_BEST_CASE WHERE 수술의ID = '${v.doctorId}' and 고객번호 = '${v.psEntry}' and OPDATE = '${v.op_date}'`;
                const checkRowsResult = await connectDB(checkSql);
                return checkRowsResult;
            })
        );
      // 체크한 고객이 있으면 업데이트
    const checks = best?.map((b1, b1Idx) => {
        const dobleCheck =
            checkDatas?.[b1Idx]?.length !== 0
            ? checkDatas?.[b1Idx]?.map((b2) => ({
                psEntry: b2?.고객번호 ? b2?.고객번호 : b1?.psEntry,
                doctorId: b2?.수술의ID ? b2?.수술의ID : b1?.doctorId,
                op_date: b2?.OPDATE ? b2?.OPDATE : b1?.op_date,
                isState:
                    b2?.고객번호 && b2?.수술의ID && b2?.OPDATE
                    ? "UPDATE"
                    : "INSERT",
            }))
            : [
                {
                    psEntry: b1?.psEntry,
                    doctorId: b1?.doctorId,
                    op_date: b1?.op_date,
                    isState: "INSERT",
                },
            ];
        return dobleCheck;
    });
    const checkedPost = checks?.map(async (c) => {
        let sql;
        const checkedData = c?.[0];
        const isState = checkedData?.isState;
        if (isState === "INSERT") {
            sql = `INSERT INTO MAIL_OPE_BEST_CASE (고객번호, 수술의ID, last_updated, OPDATE)
            VALUES ('${checkedData.psEntry}', '${checkedData.doctorId}', SYSDATETIME(), '${checkedData.op_date}')`;
        } else {
            sql = `UPDATE MAIL_OPE_BEST_CASE SET last_updated = SYSDATETIME()
            WHERE 고객번호 = '${checkedData.psEntry}' AND 수술의ID = '${checkedData.doctorId}' AND OPDATE = '${checkedData.op_date}'`;
        }
        const checkedPostResult = await connectDB(sql);
        return checkedPostResult;
    });
      // 미선택한 수술이 베스트 케이스에 있는지 확인
    const unCheckDatas = await Promise.all(
        unBest.map(async (v) => {
            const checkSql = `SELECT 고객번호, 수술의ID, OPDATE FROM MAIL_OPE_BEST_CASE WHERE 수술의ID = '${v.doctorId}' AND 고객번호 = '${v.psEntry}' and OPDATE = '${v.op_date}'`;
            const checkRowsResult = await connectDB(checkSql);
            return checkRowsResult;
        })
    );
      // 미체크한 고객이 있으면 삭제
    const unChecks = unBest?.map((b1, b1Idx) => {
        const dobleUnCheck =
            unCheckDatas?.[b1Idx]?.length !== 0
            ? unCheckDatas?.[b1Idx]?.map((b2) => ({
                psEntry: b2?.고객번호 ? b2?.고객번호 : b1?.psEntry,
                doctorId: b2?.수술의ID ? b2?.수술의ID : b1?.doctorId,
                op_date: b2?.OPDATE ? b2?.OPDATE : b1?.op_date,
                isState:
                    b2?.고객번호 && b2?.수술의ID && b2?.OPDATE
                    ? "DELETE"
                    : "INSERT",
            }))
            : [
                {
                    psEntry: b1?.psEntry,
                    doctorId: b1?.doctorId,
                    op_date: b1?.op_date,
                    isState: "INSERT",
                },
            ];
        return dobleUnCheck;
    });
    const unCheckedPost = unChecks?.map(async (c) => {
        let sql;
        const unCheckedData = c?.[0];
        const isState = unCheckedData?.isState;
        if (isState === "DELETE") {
            sql = `DELETE FROM MAIL_OPE_BEST_CASE
            WHERE 수술의ID = '${unCheckedData.doctorId}' AND 고객번호 = '${unCheckedData.psEntry}' and OPDATE = '${unCheckedData.op_date}'`;
        }
        const unCheckedPostResult = await connectDB(sql);
        return unCheckedPostResult;
    });

    res.setHeader('Content-Type', 'application/json');
      // 응답 전송
        res.status(200).json({
            message: "Data received and processed successfully",
            data: bestData,
        });
    } catch (error) {
        console.error("Error handling POST request:", error);
        res.status(500).json({
        message: "Internal server error",
        error: error.message,
    });
    }
});
app.listen(5000, () => {
    console.log('app is running on port 3002');
});