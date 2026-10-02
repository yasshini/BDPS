const {
    Customer,
    Bike,
    Product,
    Invoice,
    InvoiceItem
} = require('../models');

console.log('Customer:', !!Customer);
console.log('Bike:', !!Bike);
console.log('Product:', !!Product);
console.log('Invoice:', !!Invoice);
console.log('InvoiceItem:', !!InvoiceItem);

console.log('\nAssociations:');

console.log(
    'Customer -> Bikes:',
    !!Customer.associations.bikes
);

console.log(
    'Customer -> Invoices:',
    !!Customer.associations.invoices
);

console.log(
    'Bike -> Customer:',
    !!Bike.associations.customer
);

console.log(
    'Bike -> Invoices:',
    !!Bike.associations.invoices
);

console.log(
    'Invoice -> Customer:',
    !!Invoice.associations.customer
);

console.log(
    'Invoice -> Bike:',
    !!Invoice.associations.bike
);

console.log(
    'Invoice -> Items:',
    !!Invoice.associations.items
);

console.log(
    'InvoiceItem -> Invoice:',
    !!InvoiceItem.associations.invoice
);

console.log(
    'InvoiceItem -> Product:',
    !!InvoiceItem.associations.product
);

console.log(
    '\n✅ Model relationship check completed.'
);