export interface Card {
  id: string;
  cardNumber: string;
  cardType: string;
  spendingLimit: number;
  userId: string;
  userName?: string;
  cardHolder: string;
}
