// helper function to return Mail Template with html tags to the userOrderEntry Controller
// Template to send mail about Shipment Address and other order details
const adminOrderMailTemplate = ({
    productId,
    orderPlacedAt,
    orderedBy,
    shipTo,
    quantity
}) => {
    return `
    <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f4f6f8;">
        <div style="max-width: 650px; margin: auto; background-color: #ffffff; padding: 20px; border-radius: 6px;">
            
            <h2 style="color: #2c3e50;">📦 New Order Received</h2>

            <p>Hello <b>Admin</b>,</p>

            <p>A new order has been placed. Below are the order and shipment details.</p>

            <hr/>

            <h3 style="color: #34495e;">🧾 Order Information</h3>
            <p><b>Product ID:</b> ${productId}</p>
            <p><b>Ordered By:</b> ${orderedBy}</p>
            <p><b>Quantity Ordered:</b> ${quantity}</p>
            <p><b>Order Placed At:</b> ${new Date(orderPlacedAt).toLocaleString()}</p>

            <hr/>

            <h3 style="color: #34495e;">🚚 Shipping Address</h3>
            <pre style="
                background-color: #f8f9fa;
                padding: 12px;
                border-radius: 4px;
                font-size: 14px;
                white-space: pre-wrap;
                line-height: 1.5;
            ">${shipTo}</pre>

            <hr/>

            <p>Please proceed with order processing and shipment.</p>

            <p style="margin-top: 30px;">
                Regards,<br/>
                <b>E-Commerce System (Auto Notification)</b>
            </p>
        </div>
    </div>
    `;
};

module.exports = {
    adminOrderMailTemplate
};
