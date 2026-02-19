import { Request, Response } from "express";

const { PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET } = process.env;

let paypalClient: any = null;
let ordersController: any = null;
let oAuthController: any = null;

async function getPayPalClient() {
  if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
    return null;
  }
  if (!paypalClient) {
    const sdk = await import("@paypal/paypal-server-sdk");
    const Client = (sdk as any).Client || (sdk as any).default?.Client;
    const Environment = (sdk as any).Environment || (sdk as any).default?.Environment;
    const LogLevel = (sdk as any).LogLevel || (sdk as any).default?.LogLevel;
    const OrdersController = (sdk as any).OrdersController || (sdk as any).default?.OrdersController;
    const OAuthAuthorizationController = (sdk as any).OAuthAuthorizationController || (sdk as any).default?.OAuthAuthorizationController;

    paypalClient = new Client({
      clientCredentialsAuthCredentials: {
        oAuthClientId: PAYPAL_CLIENT_ID,
        oAuthClientSecret: PAYPAL_CLIENT_SECRET,
      },
      timeout: 0,
      environment:
        process.env.NODE_ENV === "production"
          ? Environment.Production
          : Environment.Sandbox,
      logging: {
        logLevel: LogLevel.Info,
        logRequest: { logBody: true },
        logResponse: { logHeaders: true },
      },
    });
    ordersController = new OrdersController(paypalClient);
    oAuthController = new OAuthAuthorizationController(paypalClient);
  }
  return { ordersController, oAuthController };
}

export function isPayPalConfigured(): boolean {
  return !!(PAYPAL_CLIENT_ID && PAYPAL_CLIENT_SECRET);
}

export async function getClientToken() {
  const controllers = await getPayPalClient();
  if (!controllers) throw new Error("PayPal not configured");

  const auth = Buffer.from(
    `${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`,
  ).toString("base64");

  const { result } = await controllers.oAuthController.requestToken(
    { authorization: `Basic ${auth}` },
    { intent: "sdk_init", response_type: "client_token" },
  );

  return result.accessToken;
}

export async function createPaypalOrder(req: Request, res: Response) {
  try {
    const controllers = await getPayPalClient();
    if (!controllers) {
      return res.status(503).json({ error: "PayPal is not configured" });
    }

    const { amount, currency, intent } = req.body;

    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      return res.status(400).json({ error: "Invalid amount." });
    }
    if (!currency) {
      return res.status(400).json({ error: "Currency is required." });
    }
    if (!intent) {
      return res.status(400).json({ error: "Intent is required." });
    }

    const collect = {
      body: {
        intent: intent,
        purchaseUnits: [
          {
            amount: {
              currencyCode: currency,
              value: amount,
            },
          },
        ],
      },
      prefer: "return=minimal",
    };

    const { body, ...httpResponse } = await controllers.ordersController.createOrder(collect);
    const jsonResponse = JSON.parse(String(body));
    res.status(httpResponse.statusCode).json(jsonResponse);
  } catch (error) {
    console.error("Failed to create order:", error);
    res.status(500).json({ error: "Failed to create order." });
  }
}

export async function capturePaypalOrder(req: Request, res: Response) {
  try {
    const controllers = await getPayPalClient();
    if (!controllers) {
      return res.status(503).json({ error: "PayPal is not configured" });
    }

    const { orderID } = req.params;
    const collect = { id: orderID, prefer: "return=minimal" };

    const { body, ...httpResponse } = await controllers.ordersController.captureOrder(collect);
    const jsonResponse = JSON.parse(String(body));
    res.status(httpResponse.statusCode).json(jsonResponse);
  } catch (error) {
    console.error("Failed to capture order:", error);
    res.status(500).json({ error: "Failed to capture order." });
  }
}

export async function loadPaypalDefault(req: Request, res: Response) {
  try {
    if (!isPayPalConfigured()) {
      return res.status(503).json({ error: "PayPal is not configured" });
    }
    const clientToken = await getClientToken();
    res.json({ clientToken });
  } catch (error) {
    console.error("Failed to get PayPal client token:", error);
    res.status(500).json({ error: "Failed to initialize PayPal" });
  }
}
