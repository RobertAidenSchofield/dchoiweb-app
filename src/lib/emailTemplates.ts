import { Order, Product } from '@/types/store';

export function getOrderConfirmationEmailHtml(order: Order, customNote?: string): string {
  const note = customNote || 'Every piece at DCHOI DESIGNS is crafted slowly in our Chicago studio. Your order has been placed into our fulfillment queue and will be packaged with archival care.';
  const itemsHtml = (order.items && order.items.length > 0)
    ? order.items.map((item) => `
      <tr>
        <td style="padding: 12px 0; border-bottom: 1px solid #e2e8e2; color: #263b35; font-size: 14px;">
          <strong>${item.name}</strong>
        </td>
        <td style="padding: 12px 0; border-bottom: 1px solid #e2e8e2; color: #5c6e65; font-size: 14px; text-align: center;">
          ${item.quantity}
        </td>
        <td style="padding: 12px 0; border-bottom: 1px solid #e2e8e2; color: #263b35; font-size: 14px; text-align: right; font-weight: 600;">
          $${(item.price * item.quantity).toFixed(2)}
        </td>
      </tr>
    `).join('')
    : `
      <tr>
        <td style="padding: 12px 0; border-bottom: 1px solid #e2e8e2; color: #263b35; font-size: 14px;">
          <strong>${order.item}</strong>
        </td>
        <td style="padding: 12px 0; border-bottom: 1px solid #e2e8e2; color: #5c6e65; font-size: 14px; text-align: center;">
          1
        </td>
        <td style="padding: 12px 0; border-bottom: 1px solid #e2e8e2; color: #263b35; font-size: 14px; text-align: right; font-weight: 600;">
          $${order.amount.toFixed(2)}
        </td>
      </tr>
    `;

  const address = order.shippingAddress
    ? `${order.shippingAddress.street}, ${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.zip}`
    : 'Standard Studio Delivery — Chicago, IL';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Order Confirmation - ${order.id}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f1eb; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1d1d1b;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f4f1eb; padding: 40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 4px; overflow: hidden; border: 1px solid #dce3dc; max-width: 600px; width: 100%;">
          <!-- Header -->
          <tr>
            <td style="background-color: #263b35; padding: 32px 40px; text-align: left;">
              <span style="font-size: 18px; font-weight: 800; letter-spacing: 0.12em; color: #f4f1eb;">
                DCHOI<span style="color: #d8ef58;">/</span>DESIGNS
              </span>
              <p style="margin: 6px 0 0; font-size: 11px; letter-spacing: 0.14em; color: #a9bab0; text-transform: uppercase;">
                Chicago, IL · Hand-Crafted Studio
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 12px; font-size: 12px; font-weight: 600; letter-spacing: 0.12em; color: #84968d; text-transform: uppercase;">
                Order Confirmed
              </p>
              <h1 style="margin: 0 0 20px; font-size: 26px; font-weight: 400; color: #263b35; line-height: 1.2;">
                Thank you, ${order.customer}.
              </h1>
              <p style="margin: 0 0 24px; font-size: 15px; line-height: 1.6; color: #495e54;">
                ${note}
              </p>

              <!-- Order Summary Box -->
              <div style="background-color: #f8faf7; border: 1px solid #e3eae3; border-radius: 3px; padding: 20px 24px; margin-bottom: 30px;">
                <table width="100%" cellspacing="0" cellpadding="0">
                  <tr>
                    <td style="font-size: 12px; color: #7f9187; text-transform: uppercase; letter-spacing: 0.08em; padding-bottom: 6px;">
                      Order Identifier
                    </td>
                    <td style="font-size: 12px; color: #7f9187; text-transform: uppercase; letter-spacing: 0.08em; padding-bottom: 6px; text-align: right;">
                      Date
                    </td>
                  </tr>
                  <tr>
                    <td style="font-size: 16px; font-weight: 700; color: #263b35;">
                      ${order.id}
                    </td>
                    <td style="font-size: 14px; color: #3f544b; text-align: right;">
                      ${order.date}
                    </td>
                  </tr>
                </table>
              </div>

              <!-- Items Table -->
              <h3 style="margin: 0 0 14px; font-size: 14px; letter-spacing: 0.08em; text-transform: uppercase; color: #263b35;">
                Selected Pieces
              </h3>
              <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse; margin-bottom: 24px;">
                <thead>
                  <tr style="border-bottom: 1px solid #c9d4cc;">
                    <th align="left" style="padding-bottom: 8px; font-size: 11px; color: #84968d; text-transform: uppercase;">Piece</th>
                    <th align="center" style="padding-bottom: 8px; font-size: 11px; color: #84968d; text-transform: uppercase;">Qty</th>
                    <th align="right" style="padding-bottom: 8px; font-size: 11px; color: #84968d; text-transform: uppercase;">Price</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHtml}
                </tbody>
              </table>

              <!-- Total row with Shipping and Tax breakdown -->
              <table width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 28px; font-size: 13.5px;">
                <tr>
                  <td style="color: #6a7d73; padding: 4px 0;">Pieces Subtotal:</td>
                  <td align="right" style="color: #263b35; font-weight: 600;">$${(order.subtotal || order.amount).toFixed(2)}</td>
                </tr>
                <tr>
                  <td style="color: #6a7d73; padding: 4px 0;">
                    Shipping (${order.shippingMethod || 'Studio Insured Courier'}):
                  </td>
                  <td align="right" style="color: #263b35; font-weight: 600;">
                    ${order.shippingCost !== undefined ? (order.shippingCost === 0 ? 'Complimentary / Free' : `$${order.shippingCost.toFixed(2)}`) : '$0.00'}
                  </td>
                </tr>
                <tr>
                  <td style="color: #6a7d73; padding: 4px 0;">
                    Sales Tax (${order.taxRate ? `${(order.taxRate * 100).toFixed(2)}%` : '0.00%'} · ${order.taxJurisdiction || 'Destination Tax'}):
                  </td>
                  <td align="right" style="color: #263b35; font-weight: 600;">
                    ${order.taxAmount !== undefined ? (order.taxAmount === 0 ? '$0.00' : `$${order.taxAmount.toFixed(2)}`) : '$0.00'}
                  </td>
                </tr>
                <tr style="border-top: 1.5px solid #263b35;">
                  <td style="color: #263b35; font-weight: 700; padding: 8px 0; font-size: 15px; text-transform: uppercase;">
                    Total Paid:
                  </td>
                  <td align="right" style="color: #263b35; font-weight: 800; font-size: 20px; padding: 8px 0;">
                    $${order.amount.toFixed(2)}
                  </td>
                </tr>
              </table>

              <!-- Shipping Info -->
              <div style="border-top: 1px solid #e3eae3; padding-top: 24px; margin-bottom: 24px;">
                <p style="margin: 0 0 6px; font-size: 11px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: #84968d;">
                  Shipping Destination
                </p>
                <p style="margin: 0; font-size: 14px; color: #3f544b; line-height: 1.5;">
                  <strong>${order.customer}</strong><br />
                  ${address}
                </p>
              </div>

              <!-- Studio Signature -->
              <div style="background-color: #f4f1eb; border-left: 3px solid #263b35; padding: 16px 20px; margin-top: 32px;">
                <p style="margin: 0; font-size: 13px; font-style: italic; color: #495e54; line-height: 1.5;">
                  &ldquo;A properly built saya or cutting board is an investment in daily ritual. Thank you for welcoming my work into your kitchen.&rdquo;
                </p>
                <p style="margin: 8px 0 0; font-size: 12px; font-weight: 600; color: #263b35;">
                  — David Choi, Maker & Studio Owner
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #263b35; padding: 24px 40px; text-align: center; color: #b8c7bf; font-size: 12px;">
              <p style="margin: 0 0 8px;">Questions about your order? Reply directly to this email or reach us at <a href="mailto:David@dchoidesigns.com" style="color: #d8ef58; text-decoration: none;">David@dchoidesigns.com</a></p>
              <p style="margin: 0; font-size: 11px; color: #8ba093;">© ${new Date().getFullYear()} DCHOI DESIGNS · Chicago, IL</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

export function getOrderShippedEmailHtml(order: Order, carrier = 'USPS Priority Mail', trackingNumber = '9400111899562537119283'): string {
  const trackingUrl = carrier.toLowerCase().includes('ups')
    ? `https://www.ups.com/track?tracknum=${trackingNumber}`
    : carrier.toLowerCase().includes('fedex')
    ? `https://www.fedex.com/fedextrack/?trknbr=${trackingNumber}`
    : `https://tools.usps.com/go/TrackConfirmAction?tLabels=${trackingNumber}`;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Your Order Has Shipped - ${order.id}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f1eb; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1d1d1b;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f4f1eb; padding: 40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 4px; overflow: hidden; border: 1px solid #dce3dc; max-width: 600px; width: 100%;">
          <!-- Header -->
          <tr>
            <td style="background-color: #263b35; padding: 32px 40px; text-align: left;">
              <span style="font-size: 18px; font-weight: 800; letter-spacing: 0.12em; color: #f4f1eb;">
                DCHOI<span style="color: #d8ef58;">/</span>DESIGNS
              </span>
              <p style="margin: 6px 0 0; font-size: 11px; letter-spacing: 0.14em; color: #a9bab0; text-transform: uppercase;">
                Fulfillment & Tracking Notice
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 12px; font-size: 12px; font-weight: 600; letter-spacing: 0.12em; color: #4c6a81; text-transform: uppercase;">
                Package in Transit
              </p>
              <h1 style="margin: 0 0 16px; font-size: 26px; font-weight: 400; color: #263b35; line-height: 1.2;">
                Your order is on the way.
              </h1>
              <p style="margin: 0 0 28px; font-size: 15px; line-height: 1.6; color: #495e54;">
                Good news, ${order.customer}! Your pieces have been inspected, finished with food-grade protective wax, carefully packed in our Chicago studio, and handed over to the courier.
              </p>

              <!-- Tracking Card -->
              <div style="background-color: #f0f5f8; border: 1px solid #cfe0ed; border-radius: 4px; padding: 24px; margin-bottom: 30px;">
                <table width="100%" cellspacing="0" cellpadding="0">
                  <tr>
                    <td style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: #647b8e; padding-bottom: 6px;">
                      Shipping Carrier
                    </td>
                    <td style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: #647b8e; padding-bottom: 6px; text-align: right;">
                      Order Reference
                    </td>
                  </tr>
                  <tr>
                    <td style="font-size: 15px; font-weight: 700; color: #263b35;">
                      ${carrier}
                    </td>
                    <td style="font-size: 15px; font-weight: 600; color: #263b35; text-align: right;">
                      ${order.id}
                    </td>
                  </tr>
                  <tr>
                    <td colspan="2" style="padding-top: 16px; padding-bottom: 8px;">
                      <div style="font-size: 11px; color: #647b8e; text-transform: uppercase; letter-spacing: 0.08em;">Tracking Code</div>
                      <div style="font-family: monospace; font-size: 14px; color: #1e3b33; margin-top: 4px; letter-spacing: 0.05em; font-weight: bold;">
                        ${trackingNumber}
                      </div>
                    </td>
                  </tr>
                </table>

                <div style="margin-top: 18px; text-align: center;">
                  <a href="${trackingUrl}" target="_blank" style="background-color: #263b35; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 2px; font-size: 13px; font-weight: 600; display: inline-block; letter-spacing: 0.04em;">
                    Track Shipment ↗
                  </a>
                </div>
              </div>

              <!-- Item Summary -->
              <div style="border-top: 1px solid #e3eae3; padding-top: 20px;">
                <p style="margin: 0 0 8px; font-size: 11px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: #84968d;">
                  Package Contents
                </p>
                <p style="margin: 0; font-size: 14px; color: #3f544b; line-height: 1.5;">
                  <strong>${order.item}</strong> (${order.customer})
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #263b35; padding: 24px 40px; text-align: center; color: #b8c7bf; font-size: 12px;">
              <p style="margin: 0 0 8px;">Delivery questions? Reply directly to this email or write to <a href="mailto:David@dchoidesigns.com" style="color: #d8ef58; text-decoration: none;">David@dchoidesigns.com</a></p>
              <p style="margin: 0; font-size: 11px; color: #8ba093;">© ${new Date().getFullYear()} DCHOI DESIGNS · Chicago, IL</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

export function getOrderDeliveredEmailHtml(order: Order): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Delivered: Craft Care Instructions - ${order.id}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f1eb; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1d1d1b;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f4f1eb; padding: 40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 4px; overflow: hidden; border: 1px solid #dce3dc; max-width: 600px; width: 100%;">
          <!-- Header -->
          <tr>
            <td style="background-color: #263b35; padding: 32px 40px; text-align: left;">
              <span style="font-size: 18px; font-weight: 800; letter-spacing: 0.12em; color: #f4f1eb;">
                DCHOI<span style="color: #d8ef58;">/</span>DESIGNS
              </span>
              <p style="margin: 6px 0 0; font-size: 11px; letter-spacing: 0.14em; color: #a9bab0; text-transform: uppercase;">
                Delivery & Long-Term Care Guide
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 12px; font-size: 12px; font-weight: 600; letter-spacing: 0.12em; color: #4c7957; text-transform: uppercase;">
                Delivered Successfully
              </p>
              <h1 style="margin: 0 0 16px; font-size: 26px; font-weight: 400; color: #263b35; line-height: 1.2;">
                Enjoy your new piece.
              </h1>
              <p style="margin: 0 0 28px; font-size: 15px; line-height: 1.6; color: #495e54;">
                Hi ${order.customer}, according to tracking, your order has arrived! Here is your guide to maintaining and conditioning your woodwork so it lasts a lifetime.
              </p>

              <!-- Care instructions box -->
              <div style="background-color: #f7faf6; border: 1px solid #dceada; border-radius: 4px; padding: 24px; margin-bottom: 28px;">
                <h3 style="margin: 0 0 14px; font-size: 14px; text-transform: uppercase; letter-spacing: 0.08em; color: #263b35;">
                  Studio Care Principles
                </h3>
                <ul style="margin: 0; padding-left: 20px; font-size: 14px; line-height: 1.7; color: #3f544b;">
                  <li><strong>Dry blades completely:</strong> For sayas, ensure carbon or stainless knife blades are bone dry before sheathing to avoid trapped humidity.</li>
                  <li><strong>Never soak or dishwash:</strong> Hand wipe with a lukewarm damp cloth and mild dish soap. Air dry standing upright.</li>
                  <li><strong>Condition monthly:</strong> Apply food-grade mineral oil or organic board butter (beeswax/walnut oil blend) to preserve rich grain and prevent cracking.</li>
                  <li><strong>Studio guarantee:</strong> If you ever need fitment tuning or resurfacing, reach out to David in Chicago.</li>
                </ul>
              </div>

              <p style="margin: 0; font-size: 14px; color: #495e54; line-height: 1.6;">
                We hope this piece brings joy to your cooking and living space. Thank you once again for supporting independent Chicago craft.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #263b35; padding: 24px 40px; text-align: center; color: #b8c7bf; font-size: 12px;">
              <p style="margin: 0 0 8px;">Questions or custom requests? Email <a href="mailto:David@dchoidesigns.com" style="color: #d8ef58; text-decoration: none;">David@dchoidesigns.com</a></p>
              <p style="margin: 0; font-size: 11px; color: #8ba093;">© ${new Date().getFullYear()} DCHOI DESIGNS · Chicago, IL</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

export function getLowStockAlertEmailHtml(product: Product, currentStock: number): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Low Stock Alert - ${product.name}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f1eb; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding: 30px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="560" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border: 1px solid #dce3dc; padding: 32px;">
          <tr>
            <td>
              <span style="font-size: 12px; font-weight: 700; color: #a77d35; text-transform: uppercase;">Studio Inventory Alert</span>
              <h2 style="color: #263b35; margin: 8px 0 16px;">Low Stock Warning: ${product.name}</h2>
              <p style="color: #495e54; font-size: 14px; line-height: 1.5;">
                Inventory for <strong>${product.name}</strong> (SKU: ${product.sku}) has reached <strong>${currentStock} units</strong> on hand, which is at or below your safety threshold of ${product.lowStockThreshold} units.
              </p>
              <div style="background-color: #fef8ec; border-left: 3px solid #d49c3d; padding: 12px 16px; margin: 20px 0; font-size: 13px; color: #6d501d;">
                Action recommended: Prep a new batch in the woodshop or adjust listing to pre-order status.
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function getAdminShippingLabelEmailHtml(
  order: Order,
  printLabelUrl?: string,
  printSlipUrl?: string
): string {
  const address = order.shippingAddress || {
    street: '1420 N Damen Ave',
    city: 'Chicago',
    state: 'IL',
    zip: '60622',
  };
  const carrier = order.carrier || (order.shippingMethod?.includes('UPS') ? 'UPS' : 'USPS');
  const trackingNumber = order.trackingNumber || '9405 5118 9956 2537 1192 83';
  const labelUrl = printLabelUrl || `/admin?printLabel=${order.id}`;
  const slipUrl = printSlipUrl || `/admin?printSlip=${order.id}`;

  const carrierTrackingUrl = carrier.toUpperCase().includes('UPS')
    ? `https://www.ups.com/track?tracknum=${trackingNumber}`
    : `https://tools.usps.com/go/TrackConfirmAction?tLabels=${trackingNumber}`;

  const subtotal = order.subtotal ?? (order.amount - (order.shippingCost || 0));
  const shippingFee = order.shippingCost ?? (order.amount - subtotal);

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Fulfillment &amp; Packing Manifest - ${order.id}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #eeebe3; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1d1d1b;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #eeebe3; padding: 32px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="660" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 4px; overflow: hidden; border: 1px solid #1d1d1b; max-width: 660px; width: 100%; box-shadow: 0 10px 30px rgba(0,0,0,0.08);">
          
          <!-- Urgent Studio Dispatch Banner -->
          <tr>
            <td style="background-color: #1d1d1b; padding: 22px 28px; text-align: left; color: #ffffff;">
              <table width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <span style="font-size: 10.5px; letter-spacing: 0.18em; text-transform: uppercase; color: #d8ef58; font-weight: 700; display: block; margin-bottom: 4px;">
                      ✦ Studio Fulfillment Alert · Dispatch Ready
                    </span>
                    <h1 style="margin: 0; font-size: 21px; font-weight: 800; letter-spacing: 0.06em; text-transform: uppercase; color: #ffffff;">
                      Order ${order.id} — Pack &amp; Ship
                    </h1>
                  </td>
                  <td align="right" style="vertical-align: middle;">
                    <span style="background-color: #2c2c28; border: 1px solid #d8ef58; color: #d8ef58; padding: 6px 12px; font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; border-radius: 2px; white-space: nowrap;">
                      ${order.shippingMethod || carrier}
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Quick Action Buttons Hub -->
          <tr>
            <td style="padding: 20px 28px; background-color: #f7f6f2; border-bottom: 1px solid #e3e0d8;">
              <div style="font-size: 13px; color: #55534e; margin-bottom: 14px; line-height: 1.5;">
                David, order <strong>${order.id}</strong> from <strong>${order.customer}</strong> ($${order.amount.toFixed(2)}) is cleared for packing. All shipping documents, packing slip, and thermal labels are generated below.
              </div>
              <table width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="padding-right: 6px;">
                    <a href="${labelUrl}" target="_blank" style="background-color: #1d1d1b; color: #ffffff; text-decoration: none; padding: 12px 16px; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; display: block; text-align: center; border-radius: 2px;">
                      🖨️ Print 4x6 Label
                    </a>
                  </td>
                  <td style="padding-left: 6px; padding-right: 6px;">
                    <a href="${slipUrl}" target="_blank" style="background-color: #ffffff; color: #1d1d1b; border: 1.5px solid #1d1d1b; text-decoration: none; padding: 11px 16px; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; display: block; text-align: center; border-radius: 2px;">
                      📄 Print Packing Slip
                    </a>
                  </td>
                  <td style="padding-left: 6px;">
                    <a href="https://tools.usps.com/schedule-pickup-steps.htm" target="_blank" style="background-color: #e5e2da; color: #1d1d1b; text-decoration: none; padding: 12px 14px; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; display: block; text-align: center; border-radius: 2px;">
                      🚚 Free Pickup
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- SECTION 1: OFFICIAL PACKING SLIP -->
          <tr>
            <td style="padding: 28px 28px 12px;">
              <div style="border: 1px solid #d5d1c8; border-radius: 3px; padding: 24px; background-color: #ffffff; box-shadow: 0 2px 8px rgba(0,0,0,0.04);">
                
                <!-- Packing Slip Header -->
                <table width="100%" cellspacing="0" cellpadding="0" style="border-bottom: 2px solid #1d1d1b; padding-bottom: 16px; margin-bottom: 20px;">
                  <tr>
                    <td>
                      <div style="font-size: 18px; font-weight: 900; letter-spacing: 0.15em; text-transform: uppercase; color: #1d1d1b;">
                        DCHOI / DESIGNS
                      </div>
                      <div style="font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; color: #76746e; margin-top: 3px;">
                        Chicago Studio · 1420 N Damen Ave · 41°53′N 87°38′W
                      </div>
                    </td>
                    <td align="right">
                      <div style="font-size: 15px; font-weight: 800; font-family: monospace; color: #1d1d1b;">
                        PACKING SLIP ${order.id}
                      </div>
                      <div style="font-size: 11px; color: #76746e; margin-top: 2px;">
                        Date: ${order.date || 'Today'}
                      </div>
                    </td>
                  </tr>
                </table>

                <!-- Destination & Carrier Metadata -->
                <table width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 22px; font-size: 12px; line-height: 1.5;">
                  <tr>
                    <td width="55%" style="vertical-align: top; padding-right: 16px;">
                      <span style="font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #76746e; display: block; margin-bottom: 4px;">
                        Deliver To:
                      </span>
                      <strong style="font-size: 14px; color: #1d1d1b; display: block;">${order.customer}</strong>
                      <div style="color: #44423e; margin-top: 2px;">
                        ${address.street}<br />
                        ${address.city}, ${address.state} ${address.zip}
                      </div>
                      <div style="font-size: 11px; color: #76746e; margin-top: 4px;">
                        Email: ${order.email}
                      </div>
                    </td>
                    <td width="45%" style="vertical-align: top; background-color: #faf9f6; border: 1px solid #ebe7df; padding: 12px 14px; border-radius: 2px;">
                      <span style="font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #76746e; display: block; margin-bottom: 4px;">
                        Shipment Specifics:
                      </span>
                      <div style="margin-bottom: 4px;">
                        <strong>Carrier:</strong> ${order.shippingMethod || carrier}
                      </div>
                      <div style="margin-bottom: 4px;">
                        <strong>Tracking:</strong><br />
                        <a href="${carrierTrackingUrl}" target="_blank" style="font-family: monospace; font-size: 11px; color: #1d1d1b; text-decoration: underline; font-weight: bold;">
                          ${trackingNumber} ↗
                        </a>
                      </div>
                      <div>
                        <strong>Fulfillment:</strong> <span style="color: #2d6b38; font-weight: bold;">PAID · DISPATCH QUEUE</span>
                      </div>
                    </td>
                  </tr>
                </table>

                <!-- Itemized Specimen Table -->
                <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse; margin-bottom: 20px; font-size: 12px;">
                  <thead>
                    <tr style="background-color: #f6f4ee; border-top: 1px solid #1d1d1b; border-bottom: 1px solid #1d1d1b;">
                      <th align="left" style="padding: 8px 10px; font-size: 10.5px; text-transform: uppercase; letter-spacing: 0.08em; color: #1d1d1b;">Specimen / Item</th>
                      <th align="center" style="padding: 8px 10px; font-size: 10.5px; text-transform: uppercase; letter-spacing: 0.08em; color: #1d1d1b; width: 60px;">Qty</th>
                      <th align="right" style="padding: 8px 10px; font-size: 10.5px; text-transform: uppercase; letter-spacing: 0.08em; color: #1d1d1b; width: 100px;">Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${
                      order.items && order.items.length > 0
                        ? order.items
                            .map(
                              (it) => `
                      <tr style="border-bottom: 1px solid #e8e5dc;">
                        <td style="padding: 10px; font-weight: 600; color: #1d1d1b;">${it.name}</td>
                        <td align="center" style="padding: 10px; color: #44423e;">${it.quantity}</td>
                        <td align="right" style="padding: 10px; font-weight: 600; color: #1d1d1b;">$${it.price.toFixed(2)}</td>
                      </tr>`
                            )
                            .join('')
                        : `
                      <tr style="border-bottom: 1px solid #e8e5dc;">
                        <td style="padding: 10px; font-weight: 600; color: #1d1d1b;">${order.item}</td>
                        <td align="center" style="padding: 10px; color: #44423e;">1</td>
                        <td align="right" style="padding: 10px; font-weight: 600; color: #1d1d1b;">$${subtotal.toFixed(2)}</td>
                      </tr>`
                    }
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colspan="2" align="right" style="padding: 8px 10px; font-size: 11px; color: #76746e; text-transform: uppercase;">Piece Subtotal:</td>
                      <td align="right" style="padding: 8px 10px; font-size: 12px; color: #44423e;">$${subtotal.toFixed(2)}</td>
                    </tr>
                    <tr>
                      <td colspan="2" align="right" style="padding: 4px 10px; font-size: 11px; color: #76746e; text-transform: uppercase;">Shipping (${order.shippingMethod || carrier}):</td>
                      <td align="right" style="padding: 4px 10px; font-size: 12px; color: #44423e;">${shippingFee === 0 ? 'Complimentary' : `$${shippingFee.toFixed(2)}`}</td>
                    </tr>
                    <tr>
                      <td colspan="2" align="right" style="padding: 4px 10px; font-size: 11px; color: #76746e; text-transform: uppercase;">
                        Sales Tax (${order.taxRate ? `${(order.taxRate * 100).toFixed(2)}%` : '0.00%'} · ${order.taxJurisdiction || 'Destination Tax'}):
                      </td>
                      <td align="right" style="padding: 4px 10px; font-size: 12px; color: #44423e;">
                        ${order.taxAmount !== undefined ? (order.taxAmount === 0 ? '$0.00' : `$${order.taxAmount.toFixed(2)}`) : '$0.00'}
                      </td>
                    </tr>
                    <tr style="border-top: 1.5px solid #1d1d1b;">
                      <td colspan="2" align="right" style="padding: 10px; font-size: 12px; font-weight: 800; text-transform: uppercase; color: #1d1d1b;">Grand Total Paid:</td>
                      <td align="right" style="padding: 10px; font-size: 15px; font-weight: 800; color: #1d1d1b;">$${order.amount.toFixed(2)}</td>
                    </tr>
                  </tfoot>
                </table>

                <!-- Hardwood Care Protocol Insert Text -->
                <div style="background-color: #faf9f5; border: 1px solid #e3dec3; padding: 12px 14px; font-size: 11px; color: #5a5444; line-height: 1.5; border-radius: 2px;">
                  <strong style="color: #1d1d1b; text-transform: uppercase; letter-spacing: 0.06em; display: block; margin-bottom: 2px;">
                    ✦ Hardwood Care Protocol to Enclose:
                  </strong>
                  Friction-fit tolerance scribed to spine. Wipe blade dry before sleeving. Periodically apply 100% natural Japanese Camellia (Tsubaki) oil to preserve grain elasticity. Store away from direct sunlight and forced-air registers.
                </div>
              </div>
            </td>
          </tr>

          <!-- SECTION 2: PRINTABLE 4x6 THERMAL SHIPPING LABEL -->
          <tr>
            <td style="padding: 20px 28px 28px;">
              <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #76746e; margin-bottom: 8px; text-align: center;">
                ✂ 4x6" Thermal Shipping Label (Print or Clip)
              </div>
              
              <!-- 4x6 Thermal Label Container -->
              <div style="border: 2.5px solid #000000; padding: 20px; background-color: #ffffff; max-width: 440px; margin: 0 auto; box-shadow: 0 4px 18px rgba(0,0,0,0.09); font-family: Arial, Helvetica, sans-serif;">
                
                <!-- Carrier Header Bar -->
                <table width="100%" cellspacing="0" cellpadding="0" style="border-bottom: 2px solid #000000; padding-bottom: 8px; margin-bottom: 12px;">
                  <tr>
                    <td style="width: 52px; height: 52px; border: 2.5px solid #000000; text-align: center; vertical-align: middle; font-size: 34px; font-weight: 900; line-height: 1; color: #000000;">
                      ${carrier.toUpperCase().includes('UPS') ? 'U' : 'P'}
                    </td>
                    <td style="padding-left: 12px;">
                      <div style="font-size: 16px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.05em; color: #000000;">
                        ${carrier.toUpperCase()} ${carrier.toUpperCase().includes('UPS') ? '2ND DAY AIR®' : 'PRIORITY MAIL 2-DAY®'}
                      </div>
                      <div style="font-size: 9.5px; font-weight: bold; text-transform: uppercase; color: #333333; margin-top: 2px;">
                        COMMERCIAL BASE POSTAGE PAID · PERMIT NO. 1048 CHICAGO IL
                      </div>
                    </td>
                  </tr>
                </table>

                <!-- Origin / From -->
                <div style="font-size: 10px; line-height: 1.3; text-transform: uppercase; margin-bottom: 12px; border-bottom: 1px solid #000000; padding-bottom: 8px;">
                  <strong>DAVID CHOI / DCHOI DESIGNS</strong><br />
                  1420 N DAMEN AVE<br />
                  CHICAGO IL 60622-1984
                </div>

                <!-- Ship To Block -->
                <div style="font-size: 11px; text-transform: uppercase; margin-bottom: 16px; padding-left: 14px;">
                  <span style="font-size: 9px; color: #666666; font-weight: bold;">SHIP TO:</span><br />
                  <strong style="font-size: 14px; line-height: 1.4; color: #000000;">${order.customer}</strong><br />
                  <span style="font-size: 13px; font-weight: bold; line-height: 1.35; color: #000000;">
                    ${address.street}<br />
                    ${address.city} ${address.state} ${address.zip}
                  </span>
                </div>

                <!-- High-Resolution Vector-Style Barcode Block -->
                <div style="border-top: 2px solid #000000; padding-top: 14px; text-align: center;">
                  <div style="height: 56px; background: repeating-linear-gradient(90deg, #000 0px, #000 2px, #fff 2px, #fff 4px, #000 4px, #000 7px, #fff 7px, #fff 9px, #000 9px, #000 13px, #fff 13px, #fff 15px, #000 15px, #000 16px, #fff 16px, #fff 19px, #000 19px, #000 24px, #fff 24px, #fff 27px); width: 92%; margin: 0 auto 6px;"></div>
                  <div style="font-family: monospace; font-size: 13.5px; font-weight: 900; letter-spacing: 0.14em; color: #000000;">
                    ${trackingNumber}
                  </div>
                </div>

                <!-- Label Footer Details -->
                <table width="100%" cellspacing="0" cellpadding="0" style="border-top: 1px solid #000000; margin-top: 12px; padding-top: 6px; font-size: 9px; text-transform: uppercase; color: #333333;">
                  <tr>
                    <td>WT: 14 OZ (0.88 LBS)</td>
                    <td align="center">ZONE 4</td>
                    <td align="right">REF: ${order.id}</td>
                  </tr>
                </table>
              </div>
            </td>
          </tr>

          <!-- SECTION 3: ARTISAN STUDIO PACKING PROTOCOL CHECKLIST -->
          <tr>
            <td style="background-color: #fbfaf8; border-top: 1px solid #e3dfd6; padding: 22px 28px; font-size: 12px; color: #55534e;">
              <strong style="color: #1d1d1b; text-transform: uppercase; font-size: 11px; letter-spacing: 0.08em; display: block; margin-bottom: 10px;">
                ✦ Studio Pre-Flight Verification Checklist:
              </strong>
              <table width="100%" cellspacing="0" cellpadding="0" style="line-height: 1.6; font-size: 12px;">
                <tr>
                  <td width="24" style="vertical-align: top; color: #1d1d1b; font-weight: bold;">[ ]</td>
                  <td style="padding-bottom: 6px;"><strong>1. Friction Fit Tolerance:</strong> Test specimen spine friction fit with studio blank.</td>
                </tr>
                <tr>
                  <td width="24" style="vertical-align: top; color: #1d1d1b; font-weight: bold;">[ ]</td>
                  <td style="padding-bottom: 6px;"><strong>2. Locking Pin:</strong> Enclose hand-turned Gaboon ebony pin in wax tissue inside the blade throat.</td>
                </tr>
                <tr>
                  <td width="24" style="vertical-align: top; color: #1d1d1b; font-weight: bold;">[ ]</td>
                  <td style="padding-bottom: 6px;"><strong>3. Organic Oil Touchup:</strong> Apply light coat of organic camellia seed oil to hardwood exterior.</td>
                </tr>
                <tr>
                  <td width="24" style="vertical-align: top; color: #1d1d1b; font-weight: bold;">[ ]</td>
                  <td style="padding-bottom: 6px;"><strong>4. Enclosures:</strong> Slip Certificate of Authenticity and Hardwood Care Guide into black envelope.</td>
                </tr>
                <tr>
                  <td width="24" style="vertical-align: top; color: #1d1d1b; font-weight: bold;">[ ]</td>
                  <td style="padding-bottom: 6px;"><strong>5. Archival Carton:</strong> Wrap in black tissue, add crinkle cushion, seal carton with reinforced water-activated kraft tape.</td>
                </tr>
                <tr>
                  <td width="24" style="vertical-align: top; color: #1d1d1b; font-weight: bold;">[ ]</td>
                  <td><strong>6. Carrier Induction:</strong> Affix 4x6" label to top surface. Hand off at carrier station or leave for scheduled Damen Ave pickup.</td>
                </tr>
              </table>
              <div style="margin-top: 14px; padding-top: 10px; border-top: 1px dashed #d5d1c8; font-size: 11px; color: #76746e;">
                Inspected &amp; Dispatched: <em>David Choi · Master Maker · Chicago, IL</em>
              </div>
            </td>
          </tr>

          <!-- Studio Footer -->
          <tr>
            <td style="background-color: #1d1d1b; padding: 18px 28px; text-align: center; color: #a9bab0; font-size: 11px;">
              DCHOI DESIGNS · Automated Studio Dispatch System · Chicago, IL 60622<br />
              <a href="/admin" style="color: #d8ef58; text-decoration: none; font-weight: 600; margin-top: 4px; display: inline-block;">
                Access Studio Admin Dashboard ↗
              </a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}


