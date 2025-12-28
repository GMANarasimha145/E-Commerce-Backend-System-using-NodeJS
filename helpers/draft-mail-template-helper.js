// helper function to return Mail Template with html tags to the userOrderEntry Controller
const orderConfirmationTemplate = ({
    username,
    orderId,
    productName,
    quantity,
    total
}) => {
    return `
    <div style="font-family: Arial; padding: 20px;">
        <h2>🛒 Order Confirmed!</h2>
        <p>Hello <b>${username}</b>,</p>

        <p>Your order has been placed successfully.</p>

        <hr/>

        <p><b>Order ID:</b> ${orderId}</p>
        <p><b>Product:</b> ${productName}</p>
        <p><b>Quantity:</b> ${quantity}</p>
        <p><b>Total Amount:</b> ₹${total}</p>

        <hr/>

        <p>Thank you for shopping with us ❤️</p>
        <p><b>Your Store Team</b></p>
    </div>
    `;
};

module.exports = {
    orderConfirmationTemplate
};
