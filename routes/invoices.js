const express = require("express")
const router = new express.Router()

const db = require("../db")
const ExpressError = require("../expressError")



router.get("/", async function(req, res, next) {
    try {
      const query = await db.query("SELECT id, comp_code FROM invoices")
      return res.json({ invoices: query.rows});
    } catch(err){
      return next(err)
    }
  });


  router.get("/:id", async function(req, res, next) {
    try {
        const query = await db.query(
            "SELECT invoices.id, invoices.amt, invoices.paid, invoices.add_date, invoices.paid_date, companies.code, companies.name, companies.description FROM invoices JOIN companies ON invoices.comp_code = companies.code WHERE invoices.id = $1", 
            [req.params.id] );
  
      if (query.rows.length === 0) {
        let notFoundError = new Error(`There is no invoice with id '${req.params.id}`);
        notFoundError.status = 404;
        throw notFoundError;
      }

    // Extracting data from the first row of the result
    const { id, amt, paid, add_date, paid_date, code, name, description } = query.rows[0];

    const invoice = {
      id,
      amt,
      paid,
      add_date,
      paid_date,
      company: {
        code,
        name,
        description
      }
    };

      return res.json({ invoice: invoice});

    } catch (err) {
      return next(err);
    }
  });
  

  router.post("/", async function(req, res, next) {
    try {
      const result = await db.query(
        `INSERT INTO invoices (comp_code, amt) VALUES ($1, $2) RETURNING id, comp_code, amt, paid, add_date, paid_date`, 
        [req.body.comp_code, req.body.amt]);
  
      return res.status(201).json({invoice: result.rows[0]});  // 201 CREATED
    } catch (err) {
      return next(err);
    }
  });
  

  
router.put("/:id", async function(req, res, next) {
    try {
      if ("id" in req.body) {
        throw new ExpressError("Not allowed", 400)
      }
  
      let arguments =  [req.body.amt, req.params.id];
      let paidDateString = '';

      if (req.body.hasOwnProperty("paid")){     

        let paidDate = null;

        if(req.body.paid)
        {
          paidDate = new Date();
        }

        arguments.push(req.body.paid);
        arguments.push(paidDate);
        paidDateString = ', paid = $3, paid_date = $4'
      }


      const result = await db.query(
        `UPDATE invoices 
             SET amt=$1             
             ${paidDateString}           
             WHERE id = $2
             RETURNING id, comp_code, amt, paid, add_date, paid_date`,
             arguments
        );
  
      if (result.rows.length === 0) {
        throw new ExpressError(`There is no invoice with code of '${req.params.id}`, 404);
      }
  
      return res.json({ invoice: result.rows[0]});
    } catch (err) {
      return next(err);
    }
  });

  
router.delete("/:id", async function(req, res, next) {
    try {
      const result = await db.query(
        "DELETE FROM invoices WHERE id = $1 RETURNING id", [req.params.id]);
  
      if (result.rows.length === 0) {
        throw new ExpressError(`There is no invoice with id of '${req.params.id}`, 404);
      }
      return res.json({ status: "deleted" });
    } catch (err) {
      return next(err);
    }
  });

  
module.exports = router;