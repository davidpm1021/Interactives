export interface BillLineItem {
  description: string;
  amount: number;
}

export interface Bill {
  biller: {
    name: string;
    addressLine1: string;
    addressLine2: string;
    phone: string;
  };
  customer: {
    name: string;
    addressLine1: string;
    addressLine2: string;
    accountNumber: string;
  };
  statementDate: string;
  dueDate: string;
  servicePeriodStart: string;
  servicePeriodEnd: string;
  previousBalance: number;
  paymentsReceived: number;
  lineItems: BillLineItem[];
  /** Only assessed when previousBalance - paymentsReceived > 0. */
  lateFee: number;
  minimumPayment: number;
}

export function emptyBillLineItem(): BillLineItem {
  return { description: '', amount: 0 };
}

export function sampleBill(): Bill {
  return {
    biller: {
      name: 'Pacific Northwest Electric',
      addressLine1: 'PO Box 4421',
      addressLine2: 'Portland, OR 97208',
      phone: '(503) 555-0142',
    },
    customer: {
      name: 'Alex Morgan',
      addressLine1: '1130 NE Halsey Street',
      addressLine2: 'Portland, OR 97232',
      accountNumber: '003-4218-9921',
    },
    statementDate: '2026-06-15',
    dueDate: '2026-07-10',
    servicePeriodStart: '2026-05-12',
    servicePeriodEnd: '2026-06-11',
    previousBalance: 84.32,
    paymentsReceived: 84.32,
    lineItems: [
      { description: 'Basic service charge', amount: 14.5 },
      { description: 'Energy used: 432 kWh @ $0.118/kWh', amount: 50.98 },
      { description: 'Delivery charges', amount: 18.7 },
      { description: 'State energy tax', amount: 2.41 },
    ],
    lateFee: 0,
    minimumPayment: 0,
  };
}
