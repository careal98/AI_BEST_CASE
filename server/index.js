import express from "express";
import { connectDB } from "./src/db.js";
import dotenv from "dotenv";
import cors from "cors";

const app = express();
dotenv.config();

const corsOptions = {
  // origin: "http://localhost:3000",
  // credentials: true,
  // methods: ["GET", "POST"],
  // optionsSuccessStatus: 200,
};

app.use(cors());
app.use(express.json());

app.get("/api/data", async (req, res) => {
  const { year, month, doctorId, offset = 0, limit = 3 } = req.query;
  const confidence1 = 0.7;
  try {
    // AI가 선정한 사진에 해당하는 수술 정보
    const baseSql = `SELECT * 
                    FROM tsfmc_mailsystem.dbo.MAIL_OPE_BEST_CASE_AI A
                    WHERE Year = ${Number(year)} 
                      AND Month = ${Number(month)}
                      AND Doctor_Id = '${doctorId}'
                      AND EXISTS (
                        SELECT 1 
                        FROM tsfmc_mailsystem.dbo.IMAGE_SECTION_INFO AS I
                        WHERE CONVERT(VARCHAR, A.Psentry) = I.surgeryID
                          AND A.Op_Date >= I.op_data
                          AND A.Surgical_Site COLLATE Korean_Wansung_CI_AS = I.section COLLATE Korean_Wansung_CI_AS
                      )
                      AND EXISTS (
                        SELECT 1 
                        FROM tsfmc_mailsystem.dbo.IMAGE_SECTION_INFO AS I
                        WHERE CONVERT(VARCHAR, A.Psentry) = I.surgeryID
                          AND A.Op_Date < I.op_data
                          AND A.Surgical_Site COLLATE Korean_Wansung_CI_AS = I.section COLLATE Korean_Wansung_CI_AS
                      )
                    ORDER BY RANK
                    OFFSET ${offset} ROWS FETCH NEXT ${limit} ROWS ONLY`;
    const results = await connectDB(baseSql);
    const info = results.map((result) => ({
      psEntry: result.Psentry,
      opDate: result.Op_Date,
      part: result.Surgical_Site,
    }));
    // AI가 선정한 수술의 psEntry로 사진 추출
    const afterRows = await Promise.all(
      info.map(async (i1) => {
        const part = i1.part;
        let parts;
        if (part === "힙업" || part === "힙") {
          parts = `section = '엉덩이' OR section = '${part}'`;
        } else if (part === "복부") {
          parts = `section = '러브핸들' OR section = '${part}'`;
        } else if (part === "허벅지") {
          parts = `section = '허파고리' OR section = '${part}'`;
        } else {
          parts = `section = '${part}'`;
        }
        const sql = `SELECT PATH, top1 FROM IMAGE_SECTION_INFO
        WHERE surgeryID = ${Number(
          i1.psEntry
        )} AND confidence1 >= ${confidence1} AND op_data > ${Number(
          i1.opDate
        )} AND (
        (section = '전신' OR section = 'null' OR section IS NULL)
          OR ${parts}
        ) ORDER BY op_data, top1`;
        const afterRowsResult = await connectDB(sql);
        return afterRowsResult;
      })
    );
    const imgs = await Promise.all(
      info.map(async (aRow, aRowIdx) => {
        const beforeImgs = [];
        const afterImgs = [];
        await Promise.all(
          afterRows?.[aRowIdx]?.map(async (row, rowIdx) => {
            const sql = `SELECT PATH FROM tsfmc_mailsystem.dbo.IMAGE_SECTION_INFO
            WHERE surgeryID = ${Number(aRow.psEntry)} AND op_data <= ${Number(
              aRow.opDate
            )} AND top1 = ${row.top1}`;
            const imgRowsResult = await connectDB(sql);
            if (imgRowsResult.length > 0) {
              beforeImgs.push([...imgRowsResult?.map((v) => v)]?.[0]?.["PATH"]);
              afterImgs.push(afterRows?.[aRowIdx]?.[rowIdx]?.["PATH"]);
            }
          })
        );
        return { beforeImgs, afterImgs };
      })
    );
    // 고객 정보
    const userRows = await Promise.all(
      info.map(async (i1) => {
        const sql = `SELECT L.고객명, L.수술의, L.메인부위명, L.sex, L.age, S.BEFORE_SIZE, S.AFTER_SIZE, S.BEFORE_WEIGHT, S.AFTER_WEIGHT FROM MAIL_OPE_LIST AS L, MAIL_OPE_SIZE AS S WHERE L.고객번호 = '${i1.psEntry}' AND L.수술일자 = '${i1.opDate}' AND L.메인부위명 = '${i1.part}' AND L.고객번호 = S.고객번호 AND L.수술일자 = S.수술일자 AND L.메인부위명 = S.메인부위명 AND EXISTS (
        SELECT TOP 1 * FROM (
            SELECT * FROM IMAGE_SECTION_INFO AS I WHERE L.고객번호 = I.surgeryID AND L.수술일자 >= I.op_data AND confidence1 >= ${confidence1} AND (
            (I.section = '전신' OR I.section = 'null' OR I.section IS NULL) 
            OR (I.section = '엉덩이' AND (L.메인부위명 = '힙업' OR L.메인부위명 = '힙'))
            OR (I.section = '러브핸들' AND L.메인부위명 = '복부')
            OR (I.section = '허파고리' AND L.메인부위명 = '허벅지') 
            OR L.메인부위명 = I.section COLLATE Korean_Wansung_CI_AS)
        ) AS IB, (
            SELECT * FROM IMAGE_SECTION_INFO AS I WHERE L.고객번호 = I.surgeryID AND L.수술일자 < I.op_data AND confidence1 >= ${confidence1} AND (
            (I.section = '전신' OR I.section = 'null' OR I.section IS NULL) 
            OR (I.section = '엉덩이' AND (L.메인부위명 = '힙업' OR L.메인부위명 = '힙'))
            OR (I.section = '러브핸들' AND L.메인부위명 = '복부')
            OR (I.section = '허파고리' AND L.메인부위명 = '허벅지') 
            OR L.메인부위명 = I.section COLLATE Korean_Wansung_CI_AS)
        ) AS IA
        WHERE IB.top1 = IA.top1
    )`;
        const userRowsResult = await connectDB(sql);
        return userRowsResult;
      })
    );
    // 베스트 선정 여부
    const isBestRows = await Promise.all(
      info.map(async (i1) => {
        const sql = `SELECT 고객번호, 수술의ID, OPDATE FROM MAIL_OPE_BEST_CASE AS M WHERE 고객번호 = '${i1.psEntry}' AND OPDATE = '${i1.opDate}' AND 수술의ID = '${doctorId}'`;
        const isBestRowsResult = await connectDB(sql);
        return isBestRowsResult;
      })
    );
    const userData = info?.map((user, userIdx) => ({
      isBest: isBestRows?.[userIdx]?.length !== 0 ? true : false,
      user: {
        psEntry: user.psEntry,
        op_data: user?.opDate,
        name: userRows?.[userIdx]?.[0]?.["고객명"],
        doctorName: userRows?.[userIdx]?.[0]?.["수술의"],
        sex: userRows?.[userIdx]?.[0]?.["sex"],
        age: userRows?.[userIdx]?.[0]?.["age"],
        op_part: userRows?.[userIdx]?.[0]?.["메인부위명"],
      },
      imgs: {
        beforeImgs: imgs?.[userIdx].beforeImgs,
        afterImgs: imgs?.[userIdx].afterImgs,
      },
      size: {
        before: userRows?.[userIdx]?.[0]?.["BEFORE_SIZE"],
        after: userRows?.[userIdx]?.[0]?.["AFTER_SIZE"],
      },
      weight: {
        before: userRows?.[userIdx]?.[0]?.["BEFORE_WEIGHT"],
        after: userRows?.[userIdx]?.[0]?.["AFTER_WEIGHT"],
      },
    }));
    res.status(200).json(userData);
  } catch (err) {
    res.status(500).json({ message: "Error fetching data", error: err });
  }
});

// ai 추천이 이미 베스트 리뷰로 선정 됐는지 확인
app.get("/api/check", async (req, res) => {
  const { year, month, doctorId } = req.query;
  try {
    const sql = ` SELECT * 
                FROM tsfmc_mailsystem.dbo.MAIL_OPE_BEST_CASE AS M, tsfmc_mailsystem.dbo.MAIL_OPE_BEST_CASE_AI AS A
                WHERE A.Doctor_Id COLLATE Korean_Wansung_CI_AS = '${doctorId}' COLLATE Korean_Wansung_CI_AS
                AND A.[Year] = ${year}
                AND A.[Month] = ${month} AND A.Psentry COLLATE Korean_Wansung_CI_AS = M.고객번호 COLLATE Korean_Wansung_CI_AS 
                AND A.Doctor_Id COLLATE Korean_Wansung_CI_AS = M.수술의ID COLLATE Korean_Wansung_CI_AS 
                `;

    const results = await connectDB(sql);
    res.status(200).json(results.length >= 3 ? false : true);
  } catch {}
});

// ai 추천이 이미 베스트 리뷰로 선정된 카운트
app.get("/api/check/count", async (req, res) => {
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
    res.status(200).json(results);
  } catch {}
});

// 베스트 선정하기
app.post("/api/best", async (req, res) => {
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

