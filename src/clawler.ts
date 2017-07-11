/**
 * Created by Xeonkung on 7/11/2017.
 */

export interface IClawerConfig {

}

export class Clawler {
    private _isOpenned = false;


    constructor(private _page: any, private _url: string, private _config: IClawerConfig){

    }

    open(){
        this._isOpenned = true;
        return this._page.open(this._url);
    }

    private setPathogen(){

    }

    private setAgeGroup(){

    }

    private setYear(){

    }
}