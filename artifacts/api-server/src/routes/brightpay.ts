import { Router, type IRouter } from "express";

const router: IRouter = Router();

const BRIGHTPAY_BASE_URL =
  "https://lqlpgghortuhdxnfqavj.supabase.co/functions/v1";
const MIN_AMOUNT = 10;
const MAX_AMOUNT = 150_000;

function getApiKey() {
  return process.env.BRIGHTPAY_API_KEY;
}

function normalizePhoneNumber(value: unknown) {
  if (typeof value !== "string") return null;
  const compact = value.replace(/[\s-]/g, "");
  if (/^07\d{8}$/.test(compact) || /^01\d{8}$/.test(compact)) {
    return `254${compact.slice(1)}`;
  }
  if (/^\+254[71]\d{8}$/.test(compact)) return compact.slice(1);
  if (/^254[71]\d{8}$/.test(compact)) return compact;
  return null;
}

function isValidExternalReference(value: unknown) {
  return (
    typeof value === "string" &&
    /^[A-Za-z0-9_-]{8,64}$/.test(value.trim())
  );
}

async function readJson(response: Response) {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    return { message: text.slice(0, 300) };
  }
}

router.post("/brightpay/pay", async (req, res) => {
  const apiKey = getApiKey();
  if (!apiKey) {
    req.log.error("BrightPay API key is missing");
    return res.status(503).json({
      error: "BrightPay is not configured. Add BRIGHTPAY_API_KEY to the app secrets.",
    });
  }

  const amount = Number(req.body?.amount);
  const phoneNumber = normalizePhoneNumber(req.body?.phone_number);
  const externalReference =
    typeof req.body?.external_reference === "string"
      ? req.body.external_reference.trim()
      : "";

  if (
    !Number.isInteger(amount) ||
    amount < MIN_AMOUNT ||
    amount > MAX_AMOUNT ||
    !phoneNumber ||
    !isValidExternalReference(externalReference)
  ) {
    return res.status(400).json({
      error:
        "Enter a valid Kenyan phone number, a whole KSh amount between 10 and 150,000, and a unique external reference.",
    });
  }

  try {
    const response = await fetch(`${BRIGHTPAY_BASE_URL}/endpoint-pay`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
      },
      body: JSON.stringify({
        amount,
        phone_number: phoneNumber,
        external_reference: externalReference,
      }),
    });
    const payload = await readJson(response);

    if (!response.ok || payload.success === false) {
      req.log.warn(
        { status: response.status, externalReference },
        "BrightPay payment initiation failed",
      );
      return res.status(response.ok ? 502 : response.status).json({
        error:
          typeof payload.message === "string"
            ? payload.message
            : typeof payload.error === "string"
              ? payload.error
              : "BrightPay could not start the payment.",
      });
    }

    return res.status(200).json(payload);
  } catch (error) {
    req.log.error({ err: error }, "BrightPay payment request failed");
    return res.status(502).json({
      error: "BrightPay is temporarily unavailable. Please try again.",
    });
  }
});

router.get("/brightpay/status", async (req, res) => {
  const apiKey = getApiKey();
  if (!apiKey) {
    req.log.error("BrightPay API key is missing");
    return res.status(503).json({
      error: "BrightPay is not configured. Add BRIGHTPAY_API_KEY to the app secrets.",
    });
  }

  const checkoutId =
    typeof req.query.checkout_id === "string"
      ? req.query.checkout_id.trim()
      : "";
  if (!checkoutId || checkoutId.length > 200) {
    return res.status(400).json({ error: "A checkout_id is required." });
  }

  try {
    const url = new URL(`${BRIGHTPAY_BASE_URL}/endpoint-status`);
    url.searchParams.set("checkout_id", checkoutId);
    const response = await fetch(url, {
      headers: { "x-api-key": apiKey },
    });
    const payload = await readJson(response);

    if (!response.ok) {
      req.log.warn({ status: response.status }, "BrightPay status check failed");
      return res.status(response.status).json({
        error:
          typeof payload.message === "string"
            ? payload.message
            : typeof payload.error === "string"
              ? payload.error
              : "BrightPay could not return the payment status.",
      });
    }

    return res.status(200).json(payload);
  } catch (error) {
    req.log.error({ err: error }, "BrightPay status request failed");
    return res.status(502).json({
      error: "BrightPay is temporarily unavailable. Please try again.",
    });
  }
});

export default router;