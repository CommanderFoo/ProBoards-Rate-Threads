/**
* Rate Threads 0.3.0 - Prototype
* http://support.proboards.com/user/2671
* Copyright (C) 2014 pixelDepth.net
*/

$(function(){
	(function(){
	
		return {
		
			options: {},
			
			rating_image: null,
			
			title: "Rating",
			rating_width: "20%",
			
			subject_width: null,
			created_by_width: null,
			replies_width: null,
			views_width: null,
			last_post_width: null,
			
			thread_data: {},
			
			binded: false,
			
			init: function(){
				if(yootil.location.check.board() || yootil.location.check.thread()){
					this.setup();
					
					if(this.rating_image){
						if(yootil.location.check.board()){
							this.in_board_rating();
							
							yootil.ajax.after_search(this.in_board_rating, this);
						} else if(yootil.location.check.thread()){
							//this.in_thread_rating();
						}
					}
				}
			},
			
			in_board_rating: function(){
				if($(".rating-item").length){
					return;
				}
				
				var list = $("div.container.threads table.list");
				var self = this;
				
				if($(".ratings-header").length  == 0){
					var replies = list.find("th.replies");
				
					if(this.subject_width){
						list.find("th.main").css("width", this.subject_width);
					}
					
					if(this.created_by_width){
						list.find("th.created-by").css("width", this.created_by_width);
					}
					
					if(this.replies_width){
						list.find("th.replies").css("width", this.replies_width);
					}
					
					if(this.views_width){
						list.find("th.views").css("width", this.views_width);
					}
					
					if(this.last_width){
						list.find("th.last").css("width", this.last_post_width);
					}
					
					replies.clone().html(this.title).css({
						"font-weight": "bold",
						"text-align": "center",
						"width": this.rating_width
					}).addClass("ratings-header").insertBefore(replies);
				}
				
				list.find("tr.item").each(function(){
					var thread_id = this.id.match(/thread-(\d+)/i)[1];
					var stars = self.set_stars(thread_id);
					
					if(self.subject_width){
						$(this).find("td.main").css("width", self.subject_width);
					}
					
					if(yootil.user.logged_in() && yootil.key.write("pixeldepth_rate_thread", thread_id)){
						stars.find("img").css("cursor", "pointer").hover(function(){
							if($(this).css("opacity") < 1){
								$(this).attr("data-rate-opac", $(this).css("opacity"));
								$(this).css("opacity", 1);
								
								var previous = $(this).prevAll();
								
								if(previous.length){
									previous.each(function(){
										$(this).attr("data-rate-opac", $(this).css("opacity"));
										$(this).css("opacity", 1);
									});
								}
							}
						}, function(){
							if($(this).attr("data-rate-opac")){
								$(this).css("opacity", $(this).attr("data-rate-opac")).removeAttr("data-rate-opac");
								
								var previous = $(this).prevAll();
								
								if(previous.length){
									previous.each(function(){
										$(this).css("opacity", $(this).attr("data-rate-opac")).removeAttr("data-rate-opac");
									});
								}
							}				
						}).click(function(event){
							self.save_rating($(this).attr("data"), thread_id);
							
							$(this).removeAttr("data-rate-opac").css("opacity", 1);
							
							var previous = $(this).prevAll();
								
							if(previous.length){
								previous.each(function(){
									$(this).removeAttr("data-rate-opac");
									$(this).css("opacity", 1);
								});
							}
							
							var next = $(this).nextAll();
								
							if(next.length){
								next.each(function(){
									$(this).removeAttr("data-rate-opac").css("opacity", 0.3);
								});
							}
						});
					}
				
					$("<td class='rating-item'></td>").css("text-align", "center").append(stars).insertBefore($(this).find("td.replies"));
				});
			},
			
			save_rating: function(rating, thread_id){
				if(this.thread_data[thread_id]){
					var user_id = yootil.user.id();
									
					if(!this.thread_data[thread_id].users.length){
						this.thread_data[thread_id].users = [{	
							u: user_id,
							r: rating
						}]
						
						this.thread_data[thread_id].ratings = 1;
						this.thread_data[thread_id].rating_score = parseInt(rating);
					} else if(this.thread_data[thread_id].user_rated){
						for(var u = 0, l = this.thread_data[thread_id].users.length; u < l; u ++){
							if(this.thread_data[thread_id].users[u].u == user_id){
								if(this.thread_data[thread_id].users[u].r == parseInt(rating)){
									return;
								}
								
								this.thread_data[thread_id].rating_score -= this.thread_data[thread_id].users[u].r;
								this.thread_data[thread_id].rating_score += parseInt(rating);
								this.thread_data[thread_id].users[u].r = parseInt(rating);
								
								break;
							}
						}
					} else {
						this.thread_data[thread_id].ratings ++;
						this.thread_data[thread_id].rating_score += parseInt(rating);
						this.thread_data[thread_id].users.push({	
							u: user_id,
							r: rating
						});
					}
				}
				
				var data = {
				
					d: this.thread_data[thread_id].users
					
				};
				
				yootil.key.set("pixeldepth_rate_thread", data, thread_id, true);
			},
			
			set_stars: function(thread_id){
				var data = this.rating_data(thread_id);
				var total_rates = 0;
				var total_rating_score = 0;
				var users_data = [];
				var user_has_rated = false;
				
				if(data.d.length){
					total_rates = data.d.length;
					
					for(var r = 0, l = data.d.length; r < l; r ++){
						total_rating_score += parseInt(data.d[r].r);
						users_data.push(data.d[r]);
						
						if(yootil.user.id() == data.d[r].u){
							user_has_rated = true;
						}
					}
				}
				
				var star_rating = Math.ceil(total_rating_score / total_rates);
				var thread_rating_stars = [];
				
				if(star_rating && !isNaN(star_rating)){
					for(var s = 0; s < star_rating; s ++){
						thread_rating_stars.push("<img src='" + this.rating_image + "' alt='' data='" + (s + 1) + "' />");
					}
				}
				
				var total = thread_rating_stars.length;
				var counter = 1;
				
				while(thread_rating_stars.length < 5){
					thread_rating_stars.push($("<span></span>").append($("<img src='" + this.rating_image + "' alt='' data='" + (total + counter) + "' />").css("opacity", "0.3")).html());
					counter ++;
				}

				this.thread_data[thread_id] = {
					
					ratings: total_rates,
					rating_score: total_rating_score,
					users: users_data,
					user_rated: user_has_rated
					
				};
				
				var s = (total_rates != 1)? "s" : "";
				
				return $("<span>" + thread_rating_stars.join("") + "</span>").attr("title", total_rates + " Rating" + s).attr("id", "thread-rating-" + thread_id);
			},
			
			rating_data: function(thread_id){
				var key_data = yootil.key.value("pixeldepth_rate_thread", thread_id, true);
				var data = {
					d: []
				};
				
				if(key_data){
					var rating_data = key_data;
					
					if(rating_data){
						var obj = rating_data;
						
						if(obj && obj.d){
							data = obj;
						}
					}
				}
				
				return data;
			},
			
			setup: function(){
				var plugin = proboards.plugin.get("pixeldepth_rate_thread");
				var settings = (plugin && plugin.settings)? plugin.settings : false;
				var images = (plugin && plugin.images)? plugin.images : false;
				
				if(images){
					this.rating_image = (settings.rating_image_url && settings.rating_image_url.length)? settings.rating_image_url : images.star;
				}
				
				if(settings){
					this.title = (settings.column_title && settings.column_title.length)? settings.column_title : this.title;
					
					if(settings.rating_width && settings.rating_width.length){
						var rating_width = settings.rating_width;
						
						if(!rating_width.match(/(px|%)$/)){
							rating_width += "%";
						}
						
						this.rating_width = rating_width;
					}				
									
					if(settings.subject_width && settings.subject_width.length){
						var subject_width = settings.subject_width;
						
						if(!subject_width.match(/(px|%)$/)){
							subject_width += "%";
						}
						
						this.subject_width = subject_width;
					}
					
					if(settings.created_by_width && settings.created_by_width.length){
						var created_by_width = settings.created_by_width;
						
						if(!created_by_width.match(/(px|%)$/)){
							created_by_width += "%";
						}
						
						this.created_by_width = created_by_width;
					}
					
					if(settings.replies_width && settings.replies_width.length){
						var replies_width = settings.replies_width;
						
						if(!replies_width.match(/(px|%)$/)){
							replies_width += "%";
						}
						
						this.replies_width = replies_width;
					}

					if(settings.views_width && settings.views_width.length){
						var views_width = settings.views_width;
						
						if(!views_width.match(/(px|%)$/)){
							views_width += "%";
						}
						
						this.views_width = views_width;
					}
					
					if(settings.last_post_width && settings.last_post_width.length){
						var last_post_width = settings.last_post_width;
						
						if(!last_post_width.match(/(px|%)$/)){
							last_post_width += "%";
						}
						
						this.last_post_width = last_post_width;
					}
				}				
			}		
		
		};
	
	})().init();
	
});