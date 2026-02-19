import { BuyerDetailDto } from '../models/user';


export interface PurchaseDto
{
    id:number
    giftName:string
    winnerName?:string
    quantity:number
}


export interface PurchaseDetailDto {
    user?: BuyerDetailDto;
    purchaseDate?: string; 
}

export interface WinnersGiftsReportDto
{
    user?: BuyerDetailDto;
    purchaseDate?: string |Date; 
    giftName:string
    giftDescription:string

}