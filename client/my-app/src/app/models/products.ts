
export interface UserGiftDto {
  id:number;
  name: string;
  ticketCost: number;
  description?: string;
  pictureUrl?: string;
  categoryName?: string;
  donorName?: string;
  winnerUser?:string
}
