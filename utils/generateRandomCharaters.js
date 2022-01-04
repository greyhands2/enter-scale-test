module.exports= function(stringLength){


    var alphas='abcdefghjklmnopqrstuvwxyz';
    var res='';
   
      if(typeof stringLength !=='number') return 'String Length Must Be a Number';
      for(var x=0; x<stringLength; x++){
        if(res.length===stringLength) break;
        res+=`${Math.floor((Math.random()*9+1))}`;
        if(res.length===stringLength) break;
        res+=`${alphas.charAt(Math.floor((Math.random()*25+1)))}`;
        if(res.length===stringLength) break;
        res+=`${alphas.charAt(Math.floor((Math.random()*25+1))).toUpperCase()}`;
        if(res.length===stringLength) break;
      }
      return res;
    
  
  
  
  
  };
  
  
  