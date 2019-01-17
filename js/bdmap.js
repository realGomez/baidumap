 $(function () {

        $(".map-panel-tab li").on("click",function () {
            $(".map-panel-tab li").removeClass("active");
            $(this).addClass("active");

            var index = $(this).index();
            $(".map-panel-detail").removeClass("active");
            $(".map-panel-detail").eq(index).addClass("active");
        });

        var cities = "<li data-href='allstores' class='filter-list'>所有城市</li>";
        for(city in allLocations){
            cities += "<li data-href='"+city+"' class='filter-list'>" + allLocations[city].name+"</li>";
        }
        $("#evisu-cities").html(cities);

        $(window).on("click",function () {
            $("#evisu-cities").slideUp();
            $("#evisu-district").slideUp();
        });

        var ua = navigator.userAgent.toLowerCase();
        if(/safari/.test(ua) && !/chrome/.test(ua) && !/baidu/.test(ua) && !/qq/.test(ua)){
            $(".evisu-map-wrapper").addClass(" safari-browser");
        }
        //初始化
        function initialize() {
            var map = new BMap.Map("allmap");
            initPoint = new BMap.Point(114.11728, 22.545459);
            map.centerAndZoom(initPoint, 12);

            //开启鼠标滚轮缩放
            map.enableScrollWheelZoom(true);

            //平移缩放控件
            var opts = {anchor: BMAP_ANCHOR_TOP_RIGHT};
            map.addControl(new BMap.NavigationControl(opts));

            //所有覆盖标签
            var allTags =  renderOverlay(map);

            // 公共定位器
            var geolocation = new BMap.Geolocation();

            //是否启用附近功能
            window.nearby = true;


            //left navigation 显示隐藏标题 移动位置
            window.activeIdentify = "";
            $("#evisu-store-list").on("click","li",function (e) {

                var liTarget = e.target,
                    idenify = $(this).attr("data-idenify");

                $("#evisu-store-list li").removeClass("active");
                $(this).addClass("active");

                if(window.activeIdentify!=""){
                    allTags[window.activeIdentify].hideTite();
                }
                window.activeIdentify  = idenify;
                allTags[idenify].showTite();
                allTags[idenify].moveToCenter();
            });

            // direction-line
            $("#evisu-store-list").on("click","#direction-line",function (e) {

                var  directTo = $(this).parents("li").attr("data-idenify");

                var webMapUrl ="http://api.map.baidu.com/marker?location=" +allTags[directTo]._point.lat+","+allTags[directTo]._point.lng+"&title="+allTags[directTo]._text
                    +"&content="+allTags[directTo]._address+"&output=html&src=webapp.bcn.evisu";

                $("#web-url-form").attr("action",webMapUrl);
                $("#web-url-form")[0].submit();

                // deviceLine(webMapUrl,mapCustomUrl);

            });


            //  select city
            $(".city.filter-item").on("click",function (e) {
                _selectedCity(e,allTags);
            });

            // select district
            $(".district.filter-item").on("click",function (e){
                _selectDistrict(e,allTags);
            });

            //search 全局搜索
            $(".clear-search a").on("click",function () {
                $(".search-wrapper input").val("");
            });

            $(".search-wrapper button").on("click",function () {
                searchAll(allTags);
            });

            // 附近搜索  related with  moveend zoomend
            $("#map-panel-nearby-content button").on("click",function () {
                searchNearby(allTags,map,geolocation);
            });

            map.addEventListener("zoomend",function () {
                mapZoomend(allTags,map);
            });

            map.addEventListener("touchmove",function (){
                $(".evisu-map-wrapper").removeClass(" active");
            });

            map.addEventListener("moveend",function () {
                mapMove(allTags,map);
            });

            // 初始化定位
            getCurrents(map,geolocation);

            // 移动 active tag 到中心
            $(".panel-ctrl").on("click",function () {
                $(".evisu-map-wrapper").toggleClass(" active");
                if(window.activeIdentify!=""){
                    setTimeout(function(){
                        allTags[window.activeIdentify].moveToCenter();
                    }, 700);
                }
            });
        }
        //init 结束



        // 浏览器定位
        function getCurrents(map,geolocation) {
            geolocation.getCurrentPosition(function(r){
                if(this.getStatus() == BMAP_STATUS_SUCCESS){

                  var  currentPoint = new BMap.Point(r.point.lng,r.point.lat);
                    map.centerAndZoom(currentPoint,12);
                    map.panTo(r.point);
                    
                    var myIcon = new BMap.Icon("http://lbsyun.baidu.com/jsdemo/img/fox.gif", new BMap.Size(120,68));
					var marker2 = new BMap.Marker(currentPoint,{icon:myIcon});  // 创建标注
					map.addOverlay(marker2); 
                } else {

                    var status = this.getStatus();
                     getLocationFail(status);
                }
            });
        }

        // 自定义覆盖物
        function renderOverlay(map) {

            function ComplexCustomOverlay(point, identifier,name, address,phone){
                this._point = point;
                this._identifier = identifier;
                this._text = name;
                this._address = address;
                this._phone = phone;
            }
            ComplexCustomOverlay.prototype = new BMap.Overlay();
            ComplexCustomOverlay.prototype.initialize = function(map){
                this._map = map;

                var ins = this;

                var div = this._div = document.createElement("div");
                div.style.position = "absolute";
                div.style.zIndex = BMap.Overlay.getZIndex(this._point.lat);
                div.style.color = "white";
                div.style.width = "42px";
                div.style.height = "64px";
                div.style.whiteSpace = "nowrap";
                div.style.MozUserSelect = "none";
                div.style.fontSize = "12px";
                div.style.cursor = "pointer";

                var span = this._span = document.createElement("h4");
                span.appendChild(document.createTextNode(this._text));
                span.style.position = "absolute";
                span.style.height = "16px";
                span.style.lineHeight = "16px";
                span.style.margin = 0;
                span.style.background="#fff";
                span.style.display = "none";
                span.style.color="rgba(51, 51, 51, 1)";
                span.style.fontWeight = "normal";
                span.style.fontSize="14px";
                span.style.padding= "10px 20px" ;
                div.appendChild(span);

                var that = this;
                var arrow = this._arrow = document.createElement("div");
                arrow.className = "evisu-tags";
                arrow.style.overflow = "hidden";
                arrow.title = this._text;
                div.appendChild(arrow);

                div.onclick = function(event){
                    window.nearby = true;
                    event.stopPropagation();
                    ins.moveToCenter();
                    window.activeIdentify = ins._identifier;
                };


                div.addEventListener("touchstart", function(){
                    $(".evisu-map-wrapper").addClass("active");
                    window.activeIdentify = ins._identifier;
                    window.nearby = true;
                    event.stopPropagation();
                    setTimeout(function(){
                        ins.moveToCenter();
                    }, 700);
                });

                map.getPanes().labelPane.appendChild(div);

                return div;
            };


            // 实现显示方法
            ComplexCustomOverlay.prototype.show = function(){
                if (this._div){
                    this._div.style.display = "";
                }
            };
            // 实现隐藏方法
            ComplexCustomOverlay.prototype.hide = function(){
                if (this._div){
                    this._div.style.display = "none";
                }
            };


            ComplexCustomOverlay.prototype.moveToCenter= function(){
                map.centerAndZoom(this._point,15);
                map.panTo(this._point);
            };

            ComplexCustomOverlay.prototype.showTite= function(){
                this._span.style.display="block";
                var h4w = this._span.offsetWidth /2 - 20;
                this._span.style.left = "-"+h4w+"px";
            };

            ComplexCustomOverlay.prototype.hideTite= function(){
                this._span.style.display="none";
            };

            ComplexCustomOverlay.prototype.draw = function(){
                var map = this._map;
                var pixel = map.pointToOverlayPixel(this._point);
                this._div.style.left = pixel.x - 20+"px";
                this._div.style.top  = pixel.y - 35 + "px";
            };

            var tagContainer = {};

            for(store in allStores){
                for(var i=0;i<allStores[store].length;i++){

                    var custome_point = new BMap.Point(allStores[store][i].longitude,allStores[store][i].latitude);
                    var EvisuTag = new ComplexCustomOverlay(custome_point,allStores[store][i].identifier,allStores[store][i].name,allStores[store][i].store_address,allStores[store][i].storelocator_phone);
                    map.addOverlay(EvisuTag);

                    tagContainer[allStores[store][i].identifier] = EvisuTag;
                }
            }

            return tagContainer;
        }

        // 地图移动
        function mapMove(allTags,map){
            for(items in allTags){
                allTags[items].hideTite();
            }

            if(window.activeIdentify!=""){
                allTags[window.activeIdentify].showTite();
            }

            if(!window.nearby){
                return;
            }
            var bs = map.getBounds();   //获取可视区域
            var bssw = bs.getSouthWest();   //可视区域左下角
            var bsne = bs.getNorthEast();   //可视区域右上角
            var swLng = bssw.lng ,
                swLat = bssw.lat ,
                neLng = bsne.lng ,
                neLat = bsne.lat;

            var storeList='';
            for(tag in allTags){
                var lng = allTags[tag]._point.lng,
                    lat =  allTags[tag]._point.lat;
                if(lng>swLng && lng<neLng && lat>swLat && lat<neLat){
                    storeList+="<li data-idenify='"+allTags[tag]._identifier+"'><div>"
                        +"<h4>"+allTags[tag]._text+"</h4>"
                        +"<div class='store-address'>"+allTags[tag]._address+"</div>"
                        +"<div class='store-tel'>"+allTags[tag]._phone +"</div>"
                        +"<div class='direct-line'><span id='direction-line'>方位指引</span></div>"
                        +"</div></li>";
                    allTags[tag].show();
                }else{
                    allTags[tag].hide();
                }
            }

            $("#evisu-store-list").html(storeList);
            if(window.activeIdentify!=""){
                $("li[data-idenify='"+window.activeIdentify+"']").addClass("active");
            }
        }

       //地图放大
       function mapZoomend(allTags,map){


           if(!window.nearby){
               return;
           }

           var bs = map.getBounds();   //获取可视区域
           var bssw = bs.getSouthWest();   //可视区域左下角
           var bsne = bs.getNorthEast();   //可视区域右上角
           var swLng = bssw.lng ,
               swLat = bssw.lat ,
               neLng = bsne.lng ,
               neLat = bsne.lat;
           var storeList='';
           for(tag in allTags){
               var lng = allTags[tag]._point.lng,
                   lat =  allTags[tag]._point.lat;
               if(lng>swLng && lng<neLng && lat>swLat && lat<neLat){
                   storeList+="<li data-idenify='"+allTags[tag]._identifier+"'><div>"
                       +"<h4>"+allTags[tag]._text+"</h4>"
                       +"<div class='store-address'>"+allTags[tag]._address+"</div>"
                       +"<div class='store-tel'>"+allTags[tag]._phone +"</div>"
                       +"<div class='direct-line'> <span id='direction-line'>方位指引</span></div>"
                       +"</div></li>";
                   allTags[tag].show();
               }else{
                   allTags[tag].hide();
               }
           }

           $("#evisu-store-list").html(storeList);
       }

        //附近搜索
       function searchNearby(allTags,map,geolocation){
           window.nearby = true;
           geolocation.getCurrentPosition(function(r){
               if(this.getStatus() == BMAP_STATUS_SUCCESS){
                   point = new BMap.Point(r.point.lng,r.point.lat);
                   map.centerAndZoom(point,12);
                   map.panTo(r.point);


                   var bs = map.getBounds();   //获取可视区域
                   var bssw = bs.getSouthWest();   //可视区域左下角
                   var bsne = bs.getNorthEast();   //可视区域右上角
                   var swLng = bssw.lng ,
                       swLat = bssw.lat ,
                       neLng = bsne.lng ,
                       neLat = bsne.lat;

                   for(tag in allTags){
                       var lng = allTags[tag]._point.lng,
                           lat =  allTags[tag]._point.lat;
                       if(lng>swLng && lng<neLng && lat>swLat && lat<neLat){
                           allTags[tag].show();
                       }else{
                           allTags[tag].hide();
                       }
                   }

               } else {
                    var status = this.getStatus();
                     getLocationFail(status);
               }
           });

       }

        //全局搜索
        function searchAll(allTags){

            window.nearby = false;



            var search = $(".search-wrapper input").val(),
                storeList="",
                regex = new RegExp(search),
                empty = true,
                resultIdentifyString = '';

            for(district in allStores){
                for(var i=0;i<allStores[district].length;i++){
                    var identify = allStores[district][i].identifier;
                    if(regex.test(allStores[district][i].name)||regex.test(allStores[district][i].store_address)){
                        storeList+="<li data-idenify='"+allStores[district][i].identifier+"'><div>"
                            +"<h4>"+allStores[district][i].name+"</h4>"
                            +"<div class='store-address'>"+allStores[district][i].store_address+"</div>"
                            +"<div class='store-tel'>"+allStores[district][i].storelocator_phone +"</div>"
                            +"<div class='direct-line'><span id='direction-line'>方位指引</span></div>"
                            +"</div></li>";
                        empty = false;


                        allTags[identify].show();
                        resultIdentifyString+="$" +identify+ "$";
                    }else{
                        allTags[identify].hide();
                    }
                }
            }

            if(empty){
                storeList="<li><h4>没有符合搜索条件的店铺</h4></li>";
            }
            $("#evisu-store-list").html(storeList);
        }

        // 选择城市 区
       function _selectedCity(e,allTags){

           window.nearby = false;
           $("#evisu-cities").slideToggle();
           $("#evisu-district").slideUp();
           e.stopPropagation();
           var target = e.target;
           var storeList = '',
               nativeDistrict="";
           if($(target).attr("data-href")=="allstores"){
               for(districtAll in allStores){
                   for(var i=0;i<allStores[districtAll].length;i++){
                       storeList+="<li data-idenify='"+allStores[districtAll][i].identifier+"'><div>"
                           +"<h4>"+allStores[districtAll][i].name+"</h4>"
                           +"<div class='store-address'>"+allStores[districtAll][i].store_address+"</div>"
                           +"<div class='store-tel'>"+allStores[districtAll][i].storelocator_phone +"</div>"
                           +"<div class='direct-line'><span id='direction-line'>方位指引</span></div>"
                           +"</div></li>";

                       var identify = allStores[districtAll][i].identifier;
                       allTags[identify].show();
                   }
               }

               $("#evisu-store-list").html(storeList);
               $("#open-cities").text("所有城市");
               $(".district.filter-item").hide();

           } else if(target.nodeName=="LI"){

               var targetCity =  $(target).attr("data-href");
               window.selectCity = targetCity;
               for(district in allLocations[targetCity].children){
                   if(allStores[district]==undefined){
                       continue;
                   }
                   for(var i=0;i<allStores[district].length;i++){
                       var identify = allStores[district][i].identifier;
                       allTags[identify].show();
                       storeList+="<li data-idenify='"+allStores[district][i].identifier+"'><div>"
                           +"<h4>"+allStores[district][i].name+"</h4>"
                           +"<div class='store-address'>"+allStores[district][i].store_address+"</div>"
                           +"<div class='store-tel'>"+allStores[district][i].storelocator_phone +"</div>"
                           +"<div class='direct-line'><span id='direction-line'>方位指引</span></div>"
                           +"</div></li>";

                   }
                   nativeDistrict+="<li data-href='"+district+"'>"+allLocations[targetCity].children[district].name+"</li>"
               }

               // 隐藏不在该市范围的标签
               for(city in allLocations){
                   if(city == targetCity){
                       continue;
                   }
                   for(district in allLocations[city].children){
                       if(allStores[district]==undefined){
                           continue;
                       }
                       for(var i=0;i<allStores[district].length;i++){
                           var identify = allStores[district][i].identifier;
                           allTags[identify].hide();
                       }
                   }
               }

               $("#evisu-store-list").html(storeList);
               $("#evisu-district").html(nativeDistrict);
               $("#open-cities").text($(target).text());
               $("#open-district").text("区");
               $(".district.filter-item").show();
           }
        }

       function _selectDistrict(e,allTags){
           window.nearby = false;
           $("#evisu-district").slideToggle();
           $("#evisu-cities").slideUp();
           e.stopPropagation();
           var target = e.target;
           var storeList = '';
           if(target.nodeName=="LI"){
               var targetDistrict =  $(target).attr("data-href");
               for(var i=0;i<allStores[targetDistrict].length;i++){
                   storeList+="<li data-idenify='"+allStores[targetDistrict][i].identifier+"'><div>"
                       +"<h4>"+allStores[targetDistrict][i].name+"</h4>"
                       +"<div class='store-address'>"+allStores[targetDistrict][i].store_address+"</div>"
                       +"<div class='store-tel'>"+allStores[targetDistrict][i].storelocator_phone +"</div>"
                       +"<div class='direct-line'><span id='direction-line'>方位指引</span></div>"
                       +"</div></li>";

                   var identify = allStores[targetDistrict][i].identifier;
                   allTags[identify].show();
               }
               $("#evisu-store-list").html(storeList);


               var selectCity =  window.selectCity;

               for(district in allLocations[selectCity].children){
                   if(allStores[district]==undefined || district== targetDistrict){
                       continue;
                   }
                   for(var i=0;i<allStores[district].length;i++){
                       var identify = allStores[district][i].identifier;
                       allTags[identify].hide();
                   }
               }
               $("#open-district").text($(target).text());
           }
       }

        function getLocationFail(status){
    switch (status)
    {
        case 2:
            alert("无法获取您的位置,请使用[筛选]功能筛选您所在的位置。");
            break;
        case 3:
            alert("无法获取您的位置,请使用[筛选]功能筛选您所在的位置。");
            break;
        case 4:
            alert("无法获取您的位置,请使用[筛选]功能筛选您所在的位置。");
            break;
        case 5:
            alert("无法获取您的位置,请使用[筛选]功能筛选您所在的位置。");
            break;
        case 6:
            alert("无法获取您的位置,请开启浏览器定位权限,iphone用户打开手机[设置-隐私-定位服务]进行设置；安卓用户打开手机[设置-应用权限管理-权限管理]查看。您也可以打开地图APP或网页地图进行导航。");
            break;
        case 7:
            alert("定位服务不可用，请使用[筛选]功能筛选您所在的位置。");
            break;
        case 8:
            alert("定位服务不可用，您可以使用[筛选]功能筛选您所在的位置。或者稍后再试。");
            break;
    }
}
        initialize();


    });