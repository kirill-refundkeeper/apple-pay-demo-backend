# Apple Pay In-App Demo Backend

This project is a simple Node.js backend designed to support an Apple Pay in-app purchase demo. It provides basic API endpoints to interact with Stripe for managing subscription plans and creating new subscriptions.

**The corresponding iOS mobile client demo app can be found here: [apple-pay-demo-app](https://github.com/refundkeeper/apple-pay-demo-app)**

## Features

*   **`/api/plans` (GET):** Lists available active Stripe subscription plans (Prices linked to active Products).
*   **`/api/subscription` (POST):** Creates a new Stripe subscription for a customer based on the provided `priceId` and returns a `clientSecret` for payment confirmation on the client-side.

## Deployment (Vercel)

Follow these steps to deploy the backend service to Vercel:

1.  **Clone the Repository (Optional):**
    If you haven't already, clone the project repository to your local machine.
    ```bash
    # git clone <repository_url>
    # cd apple-pay-in-app-demo-backend
    ```

2.  **Install Vercel CLI (If needed):**
    If you don't have the Vercel CLI installed, run:
    ```bash
    npm install -g vercel
    ```

3.  **Deploy:**
    Navigate to the project directory in your terminal and run the deployment command:

    *   For a **Preview** deployment:
        ```bash
        vercel
        ```
    *   For a **Production** deployment:
        ```bash
        vercel --prod
        ```
    Follow the CLI prompts to link the project to your Vercel account and complete the deployment.

4.  **Configure Environment Variables:**
    Go to your project settings on the Vercel dashboard (`<your-vercel-project-url>/settings/environment-variables`). Add the following environment variables:

    *   `STRIPE_SECRET_KEY`: Your Stripe **Secret Key** (use your **Test** key for Preview deployments and your **Live** key for Production).
    *   `TRIAL_PRODUCT_PRICE_ID`: The Stripe Price ID of the plan designated as the free trial plan.
    *   `TRIAL_PERIOD_DAYS`: The duration of the free trial in days (e.g., `3`, `7`, `14`).

    Make sure to set these variables for the appropriate environments (Preview, Production) on Vercel.

Once deployed and configured, the API endpoints will be available at the URL provided by Vercel.

---

## Promotion

Check out [RefundKeeper](https://refundkeeper.com) for automatically managing refund requests and saving revenue for your iOS apps & games!