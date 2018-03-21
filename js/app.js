
var vendor = "steem.lotto";
var steemws = 'wss://steemd.pevo.science';
steem.config.set('websocket',steemws);

var game1_ticket = "0.100";
var game3_ticket = "0.100";
var game2_ticket = "0.100";

var currency_steem    = " STEEM";
var currency_sbd      = " SBD";
var selected_currency = currency_sbd;
var bandwidth = true;

var user = JSON.parse(localStorage.getItem('user'));
if(user){
    removeLoginLink();
}else{
  user = {};
  user.name    = "";
  user.wif     = "";
  user.pub     = "";
  user.picture = "";
  user.sbd     = 0;
  user.steem   = 0;
  user.login   = false; 
}


getLottoHistory();
hasBandwich();

setInterval(getLottoHistory(), 5000);
setInterval(hasBandwich(), 15000);

$( document ).ready(function() {

   $(".algorithm").on("click" , function(){
      $(".pages li:first").click();
      $("#accordion").find('.panel-collapse:first').addClass("in");

   });

   $(".pages li").on( "click", function(){

      $(".navbar-nav li").removeClass("active");
      $(this).addClass("active");

      $( ".navbar-nav li" ).each(function( index ) {
        $('#' + $(this).attr('data')).hide();
      });

      $('#' + $(this).attr('data')).show();

   })
  
  $(".number , .higher-lower ,  .odd-even").on( "click", function(){


      if(!user.login) {
        $('#login-modal').click();
      }else{

            let game,title;
            let classes = $(this).attr("class");
            if(classes.search('number') >= 0){
              title = "Game number";
              game  = "number";
            }else if(classes.search('higher-lower') >= 0){
              title = "Game lower or higher";
              game = "lower/higher";
            }else if(classes.search('odd-even') >= 0){
              title = "Game odd or even";
              game = "odd/even";
            }
            let $modal = $('#myModal');
            let ticket = { 'game' : game , 'bet' : $(this).attr('data')};
            $modal.find(".modal-title").html(title);
            $modal.find(".modal-body").html("You want to buy ticket for game " +
                        game +"  with bet: " + $(this).attr('data') +
                        ". <br /> Buy with " + 
                        "<input type='checkbox' checked data-toggle='toggle' data-width='100' " +
                        "data-on=" + currency_sbd + " data-off=" + currency_steem + " data-onstyle='success'" +
                        "data-offstyle='danger' id='selected_currency'>");
            $modal.find("#buy").attr("onClick" , 'buy(\'' + JSON.stringify(ticket) + '\',\'' + game1_ticket + '\')').attr("disabled", false).show();
            $modal.find("#login").hide();
            $modal.modal('show');
            if(selected_currency == currency_steem){
              $('#selected_currency').bootstrapToggle('off');  
            }else{
              $('#selected_currency').bootstrapToggle();  
            }
            
            $('#selected_currency').change(function() {

               if($(this).prop('checked')){
                  selected_currency = currency_sbd; 
               }else{
                  selected_currency = currency_steem;
               }
              
            });

      }

  });

  if(!user.login){
    $("#login-wrap").show();
  }

  $('#login-modal').on('click' , function(){
    
    var html =  '<div class="alert alert-danger hidden"></div>'+
                '<label> Username</label>'+
                '<input class="form-control" type="text" name="username" placeholder="username">'+
                '<label> password or wif </label>'+
                '<input class="form-control" type="password" name="password"  placeholder="password of wif">';
              
        let $modal = $('#myModal');
        $modal.find(".modal-title").html("Login");
        $modal.find(".modal-body").html(html);
        $modal.find("#buy").hide();
        $modal.find("#login").attr('onClick' , 'login()').show();
        $('input[name=username]').focus();
        $modal.modal('show');
  });

});


function login(){

  username = $('input[name=username]').val() ;
  password = $('input[name=password]').val() ;


  if(steem.auth.isWif(password)) {
    key = password;
  } else {
    key = steem.auth.toWif(username, password, 'active');
  }

  user.pub = steem.auth.wifToPublic(key);
  steem.api.getAccounts([username],function(err,result){
      console.log(err,result);
     if(result.length > 0){
        user.name  = username;
        user.sbd   = result[0].sbd_balance;
        user.steem = result[0].balance;
        user.image = $.parseJSON(result[0].json_metadata).profile.profile_image ;

        var threshold = result[0]['active']['weight_threshold'];
        var auths = result[0]['active']['key_auths'];
        for(var i = 0; i < auths.length; i++) {

          if(auths[i][1] >= threshold && auths[i][0] == user.pub) {
            user.login = true;
            user.wif = key;
            removeLoginLink();
            localStorage.setItem('user', JSON.stringify(user));
          }else{
             $('.alert-danger').html('Incorrect password!').removeClass('hidden');
             console.log('error');
          }
        }

     }else{
      $('.alert-danger').html('Username not found!').removeClass('hidden');
     }

  });}

function removeLoginLink(){
  $('#login-modal').hide();
  $('#logout').show();
  $('#sbd').html(user.sbd);
  $('#steem').html(user.steem);
  $('#name').html(user.name);
  $('#image').html('<div class="Avatar" style="min-width:20px;width:20px;'+
                     'display: block !important;' +
                    'border-radius: 50%;' +
                    'background-size: cover;' +
                    'background-repeat: no-repeat;' +
                    'background-position: 50% 50%;' +
                    'border: 1px solid #e9e7e7;' +
                    'height:20px;background-image:url('+ user.image + ')"></div>');

  $("#myModal").modal('hide');
}

function logout(){
  $('#login-modal').show();
  $('#logout').hide();
  localStorage.removeItem('user');
  user = {};
  $('#sbd').html('');
  $('#steem').html('');
  $('#name').html('');
  $('#image').html('');
}

function buy(game, cost){

   if(!bandwidth){
      $('#myModal').find(".modal-body").html("Bandwidth issue, plase try again latter.");
      return;
   }

   $('#myModal').find(".modal-body").html("<i class=\"fa fa-refresh fa-spin\"></i> Sending money. Plase wait for the result!");
   $('#buy').attr("disabled", true);
    //show load animation
  steem.broadcast.transfer(user.wif, user.name, vendor, cost + selected_currency , game, function(err, result) {

     if(err){

        if(err.message.indexOf("_db.get_balance") > 0){
          $('#myModal').find(".modal-body").html("You don't have enough money to make this transfer.");
        }else{
          $('#myModal').find(".modal-body").html("Unexpection error. Please try again latter.");
        }
      
        console.log(err);

     }else{

        console.log('Successfully buy a ticket. Good luck!');

        setTimeout("getLottoHistory()",15000);
        setTimeout("getResult('" + user.name + "')",15000);
        setTimeout("refreshAccount('" + user.name + "')",15000);

     }

      
  });
}

function refreshAccount(username){
  steem.api.getAccounts([username],function(err,result){

      console.log(result);
      if(!err){
        user.sbd   = result[0].sbd_balance;
        user.steem = result[0].balance;
        $('#sbd').html(user.sbd);
        $('#steem').html(user.steem);
      }
  });
}

function getLottoHistory(){
  steem.api.getAccountHistory(vendor, -1 , 23, function(err, resultHisoty) {
          var table = "";

          if(err){
            table += "NO connection to steem blockchain network";
          }else{
              resultHisoty.reverse();

              var table ="<table class='table table-bordered'>"+
                          "<thead><th>player</th><th>bet</th><th>trx id</th>" + 
                          "<th>result</th><th>won/lost</th></tr></thead><tbody>";
              ;
              for (let element  of resultHisoty) {
                //console.log(element);
                   if(element[1].op[0] == 'transfer' && element[1].op[1].from == vendor ){

                      let memo_json = element[1].op[1].memo.replace(/'/g, '"');
                      var memo = {};
                      try{  
                          memo = JSON.parse(memo_json);
                          var r='lost';
                          var setClass="lost";
                          if( parseFloat(element[1].op[1].amount.split(" ")[0]) > 0.100){
                              r = "won";
                              setClass="won";
                          }

                          table += "<tr>"+
                          "<td>" + element[1].op[1].to + "</td>" +
                          "<td>" + memo.bet + "</td>" +
                          "<td>" + memo.trx_id + "</td>" +
                          "<td>" + memo.result + "</td>" +
                          "<td class='" + setClass + "'>" + r + "</td></tr>";
                          }catch(e){}
                    
                   }

              }

              table +="</tbody></table>";
          }
       

          $('#history').html(table);
  });
}

function getResult(username){


  steem.api.getAccountHistory(username, -1 , 15, function(err, resultHisoty) {
      console.log(resultHisoty);
      if(resultHisoty){

          resultHisoty.reverse();

          for (let element  of resultHisoty) { 

             if(element[1].op[0] == 'transfer' && element[1].op[1].from == vendor ){

                let $modal = $('#myModal');
                $modal.find(".modal-title").html("Result");
                try{

                  let response = JSON.parse(element[1].op[1].memo.replace(/'/g, '"'));
                  console.log(response);
                  $modal.find(".modal-body").html( response.msg + " Your bet: " + response.bet  + ", result: " + response.result);               
                }catch(e){
                  console.log(e);
                  $modal.find(".modal-body").html("Cann't get the result!");
                }
                
                
                $modal.find("#buy").hide();
                //$modal.modal('show');
                break;
             } 

          }



      }


  });
}


function hasBandwich(){


  steem.api.getAccountsAsync([vendor])
  .then(function (result) {
    steem.api.getDynamicGlobalPropertiesAsync()
      .then(function (gprops) {
        const STEEMIT_BANDWIDTH_AVERAGE_WINDOW_SECONDS = 60 * 60 * 24 * 7;
        let vestingShares = parseFloat(result[0].vesting_shares.replace(" VESTS", ""))
        let receivedVestingShares = parseFloat(result[0].received_vesting_shares.replace(" VESTS", ""))
        let totalVestingShares = parseFloat(gprops.total_vesting_shares.replace(" VESTS", ""))
        let max_virtual_bandwidth = parseInt(gprops.max_virtual_bandwidth, 10)
        let average_bandwidth = parseInt(result[0].average_bandwidth, 10)

        let delta_time = (new Date - new Date(result[0].last_bandwidth_update + "Z")) / 1000

        let bandwidthAllocated = (max_virtual_bandwidth  * (vestingShares + receivedVestingShares) / totalVestingShares)
        bandwidthAllocated = Math.round(bandwidthAllocated / 1000000);
        
        let new_bandwidth = 0
        if (delta_time < STEEMIT_BANDWIDTH_AVERAGE_WINDOW_SECONDS) {
          new_bandwidth = (((STEEMIT_BANDWIDTH_AVERAGE_WINDOW_SECONDS - delta_time)*average_bandwidth)/STEEMIT_BANDWIDTH_AVERAGE_WINDOW_SECONDS)
        }
        new_bandwidth = Math.round(new_bandwidth / 1000000)

        //console.log("current bandwidth used", new_bandwidth)
        //console.log("current bandwidth allocated", bandwidthAllocated)
        //console.log("bandwidth % used", 100 * new_bandwidth / bandwidthAllocated)
        //console.log("bandwidth % remaining", 100 - (100 * new_bandwidth / bandwidthAllocated))

        let b = 100 - (100 * new_bandwidth / bandwidthAllocated);
        if(b < 1){
            bandwidth = false;
        }

      })
  })

}

