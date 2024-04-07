const express = require("express")
const router = new express.Router()
const slugify = require('slugify')

const db = require("../db")
const ExpressError = require("../expressError")

router.get("/", async function(req, res, next) {
    try {
      const query = await db.query("SELECT code, industry FROM industries")
      return res.json({ industries: query.rows});
    } catch(err){
      return next(err)
    }
  });


/** POST / - create industry from data; return `{industry: industry}` */
router.post("/", async function(req, res, next) {
  try {
    const result = await db.query(
      `INSERT INTO industries (code, industry) VALUES ($1, $2) RETURNING code, industry`, 
      [slugify(req.body.industry), req.body.industry]);

    return res.status(201).json({industry: result.rows[0]});  // 201 CREATED
  } catch (err) {
    return next(err);
  }
});

/** POST / - create industry from data; return `{industry: industry}` */
router.post("/company", async function(req, res, next) {
  try {
    const result = await db.query(
      `INSERT INTO industries_companies (industry_code, company_code) VALUES ($1, $2) RETURNING industry_code, company_code`, 
      [req.body.industry_code, req.body.company_code]);

    return res.status(201).json({industries_companies: result.rows[0]});  // 201 CREATED
  } catch (err) {
    return next(err);
  }
});


module.exports = router;