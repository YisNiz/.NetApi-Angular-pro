
        export interface UserDto {
        UserName: string;
        Name: string;
        Password: string;
        Phone?: string;
        }

        export enum UserStatus {
            user=0,
            admin=1
        }
        
        export interface BuyerDetailDto {
        userName: string;
        name: string;
        phone?: string;
        }
        export type LoginRequest = Pick<UserDto, 'UserName' | 'Password' > 

        export interface LoginResponseDto {
        token: string;
        tokenType: string;  
        expiresIn: number;
        user: BuyerDetailDto;
        role:string
        }
 