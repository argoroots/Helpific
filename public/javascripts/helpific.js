angular.module('hlpfc', ['ngRoute'])



// ROUTER
    .config(function($locationProvider, $routeProvider) {
        $locationProvider.html5Mode(true)
        $routeProvider
            .when('/:lang/users', {
                controller: 'usersCtrl'
            })
            .otherwise({
                redirectTo: '/'
            })
    })



// USERS
    .controller('usersCtrl', function($scope, $http, $routeParams) {
        $http({method: 'GET', url: '/' + $routeParams.lang + '/users/json'}).success(function(data) {
            $scope.users = data
        })
    })
