// helper function to return Mail Template with html tags to the userOrderEntry Controller
// Template to send mail about Out of Stock Reminder to Admin
const outOfStockTemplate = ({
    productName,
    productId,
    productImageURL
}) => {
    return `
    <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f9f9f9;">
        <div style="max-width: 600px; margin: auto; background-color: #ffffff; padding: 20px; border-radius: 6px;">
            
            <h2 style="color: #d9534f;">⚠️ Product Out of Stock</h2>

            <p>Hello <b>Admin</b>,</p>

            <p>The following product is currently <b>out of stock</b> and requires your attention.</p>

            <hr/>

            <div style="text-align: center; margin: 20px 0;">
                <img 
                    src="${productImageURL}" 
                    alt="${productName}" 
                    style="max-width: 100%; height: auto; border-radius: 4px;"
                />
            </div>

            <p><b>Product Name:</b> ${productName}</p>
            <p><b>Product ID:</b> ${productId}</p>

            <hr/>

            <p>Please take one of the following actions:</p>
            <ul>
                <li>🛠️ Replenish the stock</li>
                <li>🗑️ Mark the product as deleted/unavailable</li>
            </ul>

            <p>Keeping inventory updated helps prevent failed orders and improves customer experience.</p>

            <p style="margin-top: 30px;">
                Regards,<br/>
                <b>E-Commerce System (Auto Notification)</b>
            </p>
        </div>
    </div>
    `;
};

module.exports = {
    outOfStockTemplate
};
