const express = require("express")
const router = new express.Router()
const slugify = require('slugify')

const db = require("../db")
const ExpressError = require("../expressError")

router.get("/", async function(req, res, next) {
    try {
      const companyQuery = await db.query("SELECT code, name FROM companies")
      return res.json({ companies: companyQuery.rows});
    } catch(err){
      return next(err)
    }
  });


  /** GET /[id] - return data about one company: `{company: company}` */

router.get("/:code", async function(req, res, next) {
  try {
    const query = await db.query(
      `SELECT c.code, c.name, c.description, i.industry 
      FROM companies AS c
      LEFT JOIN industries_companies AS ic 
        on c.code = ic.company_code
      LEFT JOIN industries as i
        on i.code = ic.industry_code
      WHERE c.code = $1`, [req.params.code]);

    const invoicesQuery = await db.query(
      "SELECT id FROM invoices WHERE comp_code = $1", [req.params.code]);
    

    if (query.rows.length === 0) {
      let notFoundError = new Error(`There is no company with id '${req.params.code}`);
      notFoundError.status = 404;
      throw notFoundError;
    }

    let invoices = invoicesQuery.rows.map(inv => inv.id);
    let { code, name, description } = query.rows[0];
    let industries = query.rows.map(i => i.industry);
    
    return res.json({ company: {code, name, description, invoices, industries} });
  } catch (err) {
    return next(err);
  }
});


/** POST / - create company from data; return `{company: company}` */

router.post("/", async function(req, res, next) {
  try {
    const result = await db.query(
      `INSERT INTO companies (code, name, description) VALUES ($1, $2, $3) RETURNING code, name, description`, 
      [slugify(req.body.name), req.body.name, req.body.description]);

    return res.status(201).json({company: result.rows[0]});  // 201 CREATED
  } catch (err) {
    return next(err);
  }
});


router.put("/:code", async function(req, res, next) {
  try {
    if ("code" in req.body) {
      throw new ExpressError("Not allowed", 400)
    }

    const result = await db.query(
      `UPDATE companies 
           SET name=$1, description=$2
           WHERE code = $3
           RETURNING code, name, description`,
      [req.body.name, req.body.description, req.params.code, ]
      );

    if (result.rows.length === 0) {
      throw new ExpressError(`There is no company with code of '${req.params.code}`, 404);
    }

    return res.json({ company: result.rows[0]});
  } catch (err) {
    return next(err);
  }
});

/** DELETE /[id] - delete cpde, return `{message: "Company deleted"}` */

router.delete("/:code", async function(req, res, next) {
  try {
    const result = await db.query(
      "DELETE FROM companies WHERE code = $1 RETURNING code", [req.params.code]);

    if (result.rows.length === 0) {
      throw new ExpressError(`There is no company with code of '${req.params.code}`, 404);
    }
    return res.json({ message: "Company deleted" });
  } catch (err) {
    return next(err);
  }
});


module.exports = router;